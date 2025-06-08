// main.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const tokens = require("./tokens");
const {
  RPC_URL,
  PRIVATE_KEYS,
  ROUTER_ADDRESS,
  ABI_PATH,
  USDT_ADDRESS,
  LOG_FILE,
  FAUCET_ADDRESS,
  FAUCET_ABI_PATH
} = require("./config");


// config
const SLIPPAGE_PERCENT = 5;
const MIN_DELAY = 0 * 60 * 1000;
const MAX_DELAY = 1 * 60 * 1000;

// setup
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const abi = JSON.parse(fs.readFileSync(ABI_PATH, "utf-8"));
const DECIMALS = Object.fromEntries(tokens.map(t => [t.address.toLowerCase(), t.decimals]));
const SYMBOLS = Object.fromEntries(tokens.map(t => [t.address.toLowerCase(), t.symbol]));
const router = new ethers.Contract(ROUTER_ADDRESS, abi, provider);
// 加载 Claim 合约 ABI
const faucetAbi = JSON.parse(fs.readFileSync(FAUCET_ABI_PATH, "utf-8"));

// helpers
function nowPlus(minutes) {
  return Math.floor(Date.now() / 1000) + minutes * 60;
}
function applySlippage(amount, percent) {
  return amount.mul(100 - percent).div(100);
}
function getRandomPercent(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function logToFile(msg) {
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const line = `${new Date().toISOString()} ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

// Claim 函数
async function claimTokens(wallet) {
  try {
    const faucet = new ethers.Contract(FAUCET_ADDRESS, faucetAbi, wallet);

    console.log(`[${wallet.address}] 🚰 发送 claimTokens...`);
    const tx = await faucet.requestTokens({
      gasLimit: 100_000,
      maxFeePerGas: ethers.utils.parseUnits("0.01", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("0.001", "gwei")
    });

    console.log(`[${wallet.address}] 📤 Claim TX: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[${wallet.address}] ✅ Claim 成功 - 区块: ${receipt.blockNumber}`);
    logToFile(`[${wallet.address}] claimTokens ✅ tx: ${tx.hash}`);
  } catch (err) {
    console.error(`[${wallet.address}] ❌ Claim 失败:`, err.reason || err.message);
    logToFile(`[${wallet.address}] claimTokens ❌ failed: ${err.reason || err.message}`);
  }
}

// core logic
async function runSwap(wallet) {
    console.log('runSwap 开始。。。')
  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ];

  const balances = [];
  for (const token of tokens) {
    //console.log('查询'+token.address+'token余额')
    const contract = new ethers.Contract(token.address, erc20Abi, wallet);
    const balance = await contract.balanceOf(wallet.address);
    if (balance.gt(0)) {
      try {
        const out = await router.getAmountsOut(balance, [token.address, USDT_ADDRESS]);
        balances.push({
          token,
          balance,
          valueInUSDT: out[1]
        });
      } catch {
        // skip tokens that can't be priced
      }
    }
  }

  //console.log('balances', balances)
  console.log('balances.length', balances.length)
  if(balances.length == 0){
    console.log(`[${wallet.address}] 💸 没有可估值资产，准备 claim...`);
  await claimTokens(wallet);
  // 给链上处理一点时间
  await delay(8000);
  return await runSwap(wallet); // 🌀 重入调用自己，继续 swap
  }

  if (balances.length < 2) {
  // 强制用 USDT 作为 tokenA
  const usdtToken = tokens.find(t => t.address.toLowerCase() === USDT_ADDRESS.toLowerCase());
  if (!usdtToken) {
    logToFile(`[${wallet.address}] ❌ fallback 使用 USDT 失败：未在 tokens 列表中找到 USDT`);
    return;
  }

  const contract = new ethers.Contract(usdtToken.address, erc20Abi, wallet);
  const balance = await contract.balanceOf(wallet.address);
  if (balance.lte(0)) {
    logToFile(`[${wallet.address}] ❌ fallback 使用 USDT 失败：USDT 余额为 0`);
    return;
  }

  balances.push({
    token: usdtToken,
    balance,
    valueInUSDT: balance // USDT 自己，对应 valueInUSDT = balance
  });

  logToFile(`[${wallet.address}] ⚠️ 可估值代币不足，使用 USDT 作为 tokenA fallback`);
}


  balances.sort((a, b) => b.valueInUSDT.sub(a.valueInUSDT));
  const tokenA = balances[0].token;
  const balance = balances[0].balance;
  const amountInBN = balance.mul(getRandomPercent(80, 95)).div(100);

  // pick random tokenB ≠ tokenA
  const tokenBChoices = tokens.filter(t => t.address !== tokenA.address);
  const tokenB = tokenBChoices[Math.floor(Math.random() * tokenBChoices.length)];

  let path = [tokenA.address, tokenB.address];
  let expectedOut;

  try {
    const amounts = await router.getAmountsOut(amountInBN, path);
    expectedOut = amounts[1];
  } catch {
    // 尝试 A → USDT → B 路径
    const altPath = [tokenA.address, USDT_ADDRESS, tokenB.address];
    try {
      const altAmounts = await router.getAmountsOut(amountInBN, altPath);
      path = altPath;
      expectedOut = altAmounts[2];
      logToFile(`[${wallet.address}] fallback path used: ${tokenA.symbol}->USDT->${tokenB.symbol}`);
    } catch {
      logToFile(`[${wallet.address}] skipped: ${tokenA.symbol}->${tokenB.symbol} path not available`);
      return;
    }
  }

  const minOut = applySlippage(expectedOut, SLIPPAGE_PERCENT);

  // approve
  const tokenAContract = new ethers.Contract(tokenA.address, erc20Abi, wallet);
  //console.log('开始授权' )
  const approveTx = await tokenAContract.approve(ROUTER_ADDRESS, amountInBN);
  //console.log('approve后' )
  console.log('📤 approveTx.hash:', approveTx.hash);
  await approveTx.wait();
  //console.log('approveTx.wait后' )

  try {
    //console.log('router.connect。。。')
    const deadline = nowPlus(10);
    const gasEstimate = await router.connect(wallet).estimateGas.swapExactTokensForTokens(
      amountInBN,
      minOut,
      path,
      wallet.address,
      deadline
    );
    //console.log('provider.getFeeData()。。。')
    //const feeData = await provider.getFeeData();
    //console.log('📊 Fee data:', feeData);

    const tx = await router.connect(wallet).swapExactTokensForTokens(
      amountInBN,
      minOut,
      path,
      wallet.address,
      deadline,
      {
        gasLimit: gasEstimate.mul(110).div(100),
        maxFeePerGas: ethers.utils.parseUnits("0.01", "gwei"),
        maxPriorityFeePerGas: ethers.utils.parseUnits("0.0012", "gwei")
      }
    );

    const receipt = await tx.wait();
    logToFile(`[${wallet.address}] swapped ${tokenA.symbol} -> ${tokenB.symbol} ✅ tx: ${receipt.transactionHash}, gasUsed: ${receipt.gasUsed.toString()}`);
  } catch (err) {
    logToFile(`[${wallet.address}] swapped ${tokenA.symbol} -> ${tokenB.symbol} ❌ failed: ${err.reason || err.message}`);
  }
  console.log('runSwap 结束。。。')
}

async function loop() {
  const wallets = PRIVATE_KEYS.split(",").map(k => new ethers.Wallet(k, provider));
    console.log('检测到钱包数量:', wallets.length);
  while (true) {
    // 🎯 随机选择一个钱包
    const walletIndex = Math.floor(Math.random() * wallets.length)
    console.log('选择的钱包索引:', walletIndex);
    const wallet = wallets[walletIndex];

    try {
      await runSwap(wallet);
    } catch (e) {
      logToFile(`[${wallet.address}] ❌ error: ${e.message}`);
    }

    // 🕒 随机等待下一轮
    const next = getRandomPercent(MIN_DELAY, MAX_DELAY);
    console.log(`⏱ 下一轮将在 ${(next / 1000 / 60).toFixed(1)} 分钟后...`);
    await delay(next);
  }
}


loop();
