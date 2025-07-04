const ethers = require("ethers");
const fs = require("fs");
const {
  RPC_URL,
  STAKE_CONTRACT_ADDRESS,
  USDT_ADDRESS,
  DEPOSIT_ABI_PATH,
  DEPOSIT_MIN_SLEEP_MS,
  DEPOSIT_MAX_SLEEP_MS
} = require("./config");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const stakeAbi = JSON.parse(fs.readFileSync(DEPOSIT_ABI_PATH, "utf8"));
  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
  ];

  // 1. 从环境变量中读取私钥字符串，并拆分为数组
  let keys = (process.env.PRIVATE_KEYS || "")
    .split(",")
    .map(k => k.trim())
    .filter(k => k.length > 0);

  while (keys.length) {
    const index = Math.floor(Math.random() * keys.length);
    const privateKey = keys.splice(index, 1)[0];
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = await wallet.getAddress();

    const usdt = new ethers.Contract(USDT_ADDRESS, erc20Abi, wallet);
    const stake = new ethers.Contract(STAKE_CONTRACT_ADDRESS, stakeAbi, wallet);

    try {
      const rawBalance = await usdt.balanceOf(address);
      const decimals = await usdt.decimals();
      const balance = Number(ethers.utils.formatUnits(rawBalance, decimals));
      console.log('decimals 和 balance', decimals, balance)
      console.log(`地址: ${address} 余额: ${balance} USDT`);

      if (balance < 1) {
        console.log("余额不足1，跳过该地址\n");
        continue;
      }

      let amount = 0;
      if (balance >= 1000) {
    amount = getRandomInt(500, 1000);
    } else if (balance >= 1) {
    amount = Math.floor(balance);
    } else {
    console.log("余额不足1，跳过该地址\n");
    continue;
    }

      console.log(`质押金额: ${amount} USDT`);

      const approveTx = await usdt.approve(STAKE_CONTRACT_ADDRESS, ethers.utils.parseUnits(amount.toString(), decimals));
      await approveTx.wait();
      console.log("授权成功");

      const depositTx = await stake.deposit(ethers.utils.parseUnits(amount.toString(), decimals));
      await depositTx.wait();
      console.log("质押成功 ✅");

    } catch (err) {
      console.error(`地址 ${address} 执行失败:`, err.message);
    }

    const delay = getRandomInt(DEPOSIT_MIN_SLEEP_MS, DEPOSIT_MAX_SLEEP_MS);
    const delayMin = Math.floor(delay / 60000);
    const delaySec = Math.floor((delay % 60000) / 1000);
    console.log(`等待 ${delayMin} 分 ${delaySec} 秒...\n`);
    await sleep(delay);
  }

  console.log("所有账户质押完成 ✅");
})();
