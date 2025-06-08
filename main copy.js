const { ethers } = require("ethers");
const fs = require("fs");
const {
  RPC_URL,
  PRIVATE_KEY,
  ROUTER_ADDRESS,
  TOKEN_A,
  TOKEN_B,
  ABI_PATH,
} = require("./config");

// === 参数配置 ===
const TOKEN_A_DECIMALS = 6; // tokenA 最小单位：6（例如 USDT）
const TOKEN_B_DECIMALS = 18;
const SLIPPAGE_PERCENT = 5;

// 初始化钱包与合约
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// 读取 ABI
const abi = JSON.parse(fs.readFileSync(ABI_PATH, "utf-8"));
const router = new ethers.Contract(ROUTER_ADDRESS, abi, wallet);

// 工具函数
function nowPlus(minutes) {
  return Math.floor(Date.now() / 1000) + minutes * 60;
}

function applySlippage(amountOut, slippagePercent) {
  return amountOut.mul(100 - slippagePercent).div(100);
}

function getRandomPercent(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function swapExactTokensForTokens() {
  const erc20Abi = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function balanceOf(address owner) view returns (uint256)"
  ];
  const tokenAContract = new ethers.Contract(TOKEN_A, erc20Abi, wallet);

  // 获取余额（以最小单位 BigNumber 表示）
  const rawBalance = await tokenAContract.balanceOf(wallet.address);

  // 随机百分比（整数 80~95）
  const percent = getRandomPercent(80, 95);

  // 计算最终兑换数量（BigNumber）并取整
  const amountIn = rawBalance.mul(percent).div(100).toBigInt(); // 转成 bigint 以便舍去小数
  const amountInBN = ethers.BigNumber.from(amountIn.toString()); // 转回 BigNumber

  const path = [TOKEN_A, TOKEN_B];
  const deadline = nowPlus(10);

  console.log(`💰 tokenA 原始余额（最小单位）：${rawBalance.toString()}`);
  console.log(`🎯 随机使用 ${percent}%，amountIn = ${amountInBN.toString()} 单位`);

  // 获取预期兑换量
  const amounts = await router.getAmountsOut(amountInBN, path);
  const expectedOut = amounts[1];
  const minOut = applySlippage(expectedOut, SLIPPAGE_PERCENT);

  console.log(`💡 预估可得 tokenB（最小单位）: ${expectedOut.toString()}`);
  console.log(`✅ 最小可接受（滑点${SLIPPAGE_PERCENT}%）: ${minOut.toString()}`);

  // 授权 Router
  console.log("🔐 发送 approve 交易...");
  const approveTx = await tokenAContract.approve(ROUTER_ADDRESS, amountInBN);
  await approveTx.wait();
  console.log("✅ approve 完成");

  // 发起 swap
  console.log("🚀 发送 swapExactTokensForTokens 交易...");
  const tx = await router.swapExactTokensForTokens(
    amountInBN,
    minOut,
    path,
    wallet.address,
    deadline,
    {
      gasLimit: 500_000
    }
  );

  const receipt = await tx.wait();
  console.log("🎉 交易成功，txHash:", receipt.transactionHash);
}

swapExactTokensForTokens().catch((err) => {
  console.error("❌ 执行失败:", err.reason || err.message || err);
});
