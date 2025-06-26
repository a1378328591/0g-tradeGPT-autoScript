const { ethers } = require("ethers");
const axios = require("axios");
const { RPC_URL, PRIVATE_KEYS } = require("./config");
const HttpsProxyAgent = require("https-proxy-agent");

// 初始化 provider 和 wallets
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallets = PRIVATE_KEYS.split(",").map((key) => new ethers.Wallet(key, provider));

// 延迟函数（5-10 秒之间）
const delay = (min = 5000, max = 10000) => new Promise(res => setTimeout(res, Math.random() * (max - min) + min));

const proxyAgent = new HttpsProxyAgent("http://127.0.0.1:7890");

// 请求地址和平台列表
const URL = "https://trade-gpt-800267618745.herokuapp.com/log/logClickAction";
const PLATFORMS = ["X", "telegram", "discord"];

// 向后端发送请求
async function sendRequests(wallet) {
  for (const platform of PLATFORMS) {
    const payload = {
      clickAction: "socialMediaShare",
      socialMediaPlatform: platform,
      walletAddress: wallet.address
    };

    try {
      const res = await axios.post(URL, payload, {
        headers: { "Content-Type": "application/json" },
        httpsAgent: proxyAgent,
        timeout: 20000
      });

      if (res.status === 200 || res.status === 201) {
        console.log(`🟢 [${wallet.address}] 成功发送 ${platform} 请求`);
      } else {
        console.log(`🟡 [${wallet.address}] ${platform} 请求响应状态码: ${res.status}`);
      }
    } catch (err) {
      console.error(`🔴 [${wallet.address}] ${platform} 请求失败:`, err.message);
    }

    await delay(); // 每个请求之间延迟 5~10s
  }
}

// 主流程
(async () => {
  const shuffledWallets = wallets.sort(() => Math.random() - 0.5); // 打乱钱包顺序

  for (const wallet of shuffledWallets) {
    console.log(`🚀 开始处理钱包: ${wallet.address}`);
    await sendRequests(wallet);
    console.log(`✅ 完成钱包: ${wallet.address}\n`);
  }

  console.log("🎉 所有钱包处理完毕");
})();
