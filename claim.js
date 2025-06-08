const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const {
  RPC_URL,
  PRIVATE_KEYS,
  FAUCET_ADDRESS,
  FAUCET_ABI_PATH,
  CLAIM_LOOP_INTERVAL_MS,
  CLAIM_DELAY_BETWEEN_ACCOUNTS_MS
} = require("./config");

// 初始化 provider 和 ABI
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const abi = JSON.parse(fs.readFileSync(FAUCET_ABI_PATH, "utf-8"));
const formatTime = (timestamp) => new Date(timestamp * 1000).toLocaleString();

// 钱包列表
const wallets = PRIVATE_KEYS.split(",").map((key) => new ethers.Wallet(key, provider));

// 工具：获取随机延迟（1~2分钟）
function getRandomDelayMs() {
  const [min, max] = CLAIM_DELAY_BETWEEN_ACCOUNTS_MS;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 处理单个钱包
async function checkAndClaim(wallet) {
  const faucet = new ethers.Contract(FAUCET_ADDRESS, abi, wallet);

  try {
    const last = await faucet.lastRequest(wallet.address);
    const cooldown = await faucet.cooldown();
    const now = Math.floor(Date.now() / 1000);
        const waitSec = Number(last) + Number(cooldown) - now;

     console.log(`[${wallet.address}] ：上次请求时间: ${formatTime(last)}， 当前时间 : ${formatTime(now)}， 剩余等待时间 : ${Math.ceil(Math.max(waitSec, 0) / 60)} 分钟`);



    if (waitSec <= 0) {
      console.log(`[${wallet.address}] 🚰 准备领取 token...`);
      const tx = await faucet.requestTokens({
        gasLimit: 100_000,
        maxFeePerGas: ethers.utils.parseUnits("0.01", "gwei"),
        maxPriorityFeePerGas: ethers.utils.parseUnits("0.001", "gwei")
      });

      console.log(`[${wallet.address}] 🧾 发送成功: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`[${wallet.address}] ✅ 领取成功，区块号: ${receipt.blockNumber}`);

      return true; // ✅ 成功
    } else {
      console.log(`[${wallet.address}] ⏳ 距离下一次领取还有 ${Math.ceil(waitSec / 60)} 分钟`);
      return false;
    }
  } catch (err) {
    console.error(`[${wallet.address}] ❌ 领取失败: ${err.reason || err.message}`);
    return false;
  }
}

// 主循环：每 40 分钟执行一轮
async function runLoop() {
  while (true) {
    console.log(`\n🚀 [${new Date().toISOString()}] 本轮 claim 开始，共 ${wallets.length} 个钱包`);

    for (const wallet of wallets) {
      const success = await checkAndClaim(wallet);

      // ✅ 如果领取成功，延迟 1~2 分钟
      if (success) {
        const delay = getRandomDelayMs();
        console.log(`⏳ 等待 ${Math.floor(delay / 1000)} 秒后处理下一个钱包...\n`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    console.log(`🌙 所有钱包已检查完毕，等待下轮运行...\n`);
    await new Promise((r) => setTimeout(r, CLAIM_LOOP_INTERVAL_MS));
  }
}

runLoop().catch((e) => {
  console.error("❌ 主循环异常:", e.message || e);
});
