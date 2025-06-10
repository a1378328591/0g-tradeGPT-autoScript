const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { PRIVATE_KEYS, RPC_URL } = require("./config");
const HttpsProxyAgent = require('https-proxy-agent');
const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:7890');

// provider，RPC_URL 请在 config.js 配置好
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// 从 PRIVATE_KEYS 生成钱包地址列表
const wallets = PRIVATE_KEYS.split(",").map(key => new ethers.Wallet(key.trim(), provider));
const walletAddresses = wallets.map(w => w.address);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRankAndPoints(walletAddress) {
  try {
    const url = `https://trade-gpt-800267618745.herokuapp.com/points/${walletAddress}`;
    const res = await axios.get(url, { httpsAgent: proxyAgent });
    return res.data;
  } catch (error) {
    console.error(`请求钱包 ${walletAddress} 数据失败:`, error.message);
    return null;
  }
}

async function main() {
  const results = [];

  for (const addr of walletAddresses) {
    const data = await fetchRankAndPoints(addr);
    if (data) {
      results.push({
        wallet: data.walletAddress,
        rank: data.rank,
        totalPoints: data.totalPoints,
      });
      console.log(`已获取钱包 ${data.walletAddress} 的排名和积分`);
    }
    await delay(3000);
  }

  const logsDir = path.resolve(__dirname, "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }

  const content = results
    .map(r => `钱包: ${r.wallet}\t排名: ${r.rank}\t积分: ${r.totalPoints}`)
    .join("\n");

  const filePath = path.join(logsDir, "rank.txt");
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`所有数据已写入文件：${filePath}`);
}

main();
