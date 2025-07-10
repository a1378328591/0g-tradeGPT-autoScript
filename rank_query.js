const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { PRIVATE_KEYS, RPC_URL } = require("./config");
const { HttpsProxyAgent } = require('https-proxy-agent');
const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:7890');

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallets = PRIVATE_KEYS.split(",").map((key) => new ethers.Wallet(key.trim(), provider));
const walletAddresses = wallets.map((w) => w.address);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLeaderboardData(walletAddress) {
  try {
    const url = `https://trade-gpt-800267618745.herokuapp.com/points/challengeLeaderboard/${walletAddress}`;
    const res = await axios.get(url, { httpsAgent: proxyAgent });

    const data = res.data?.userPoints;
    if (!data) throw new Error("无效返回数据");

    return {
      wallet: walletAddress,
      totalPoints: data.totalPoints,
      mainnetPoints: 0, // 新接口没有提供，填默认值
      testnetPoints: 0, // 新接口没有提供，填默认值
      socialPoints: 0,  // 新接口没有提供，填默认值
      rank: data.rank,
      lastUpdated: data.lastUpdatedFormatted,
    };
  } catch (error) {
    console.error(`❌ 获取钱包 ${walletAddress} 的数据失败:`, error.message);
    return null;
  }
}


// 表格格式输出函数
function formatTable(data) {
  const headers = [
    "钱包地址",
    "总积分",
    "Mainnet 积分",
    "Testnet 积分",
    "Social 积分",
    "排名",
    "最后更新时间"
  ];

  const rows = data.map(r => [
    r.wallet,
    r.totalPoints.toLocaleString(),
    r.mainnetPoints.toLocaleString(),
    r.testnetPoints.toLocaleString(),
    r.socialPoints.toLocaleString(),
    r.rank.toString(),
    r.lastUpdated || "-"
  ]);

  // 计算每列最大宽度
  const colWidths = headers.map((h, i) =>
    Math.max(
      h.length,
      ...rows.map(row => row[i].length)
    )
  );

  const drawLine = (charLeft, charMid, charRight, charFill) => {
    return charLeft +
      colWidths.map(w => charFill.repeat(w + 2)).join(charMid) +
      charRight;
  };

  const formatRow = row =>
    "║" +
    row
      .map((cell, i) => ` ${cell.padEnd(colWidths[i])} `)
      .join("║") +
    "║";

  const lines = [
    drawLine("╔", "╦", "╗", "═"),
    formatRow(headers),
    drawLine("╠", "╬", "╣", "═"),
    ...rows.map(formatRow),
    drawLine("╚", "╩", "╝", "═")
  ];

  return lines.join("\n");
}

async function main() {
  const results = [];

  for (const addr of walletAddresses) {
    const data = await fetchLeaderboardData(addr);
    if (data) {
      results.push(data);
      console.log(`✅ 成功获取 ${addr} 的积分数据`);
    }
    await delay(3000); // 等待 3 秒，防止过快请求
  }

  const logsDir = path.resolve(__dirname, "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }

  const tableText = formatTable(results);
  const filePath = path.join(logsDir, "rank.txt");
  fs.writeFileSync(filePath, tableText, "utf-8");

  console.log(`📄 所有数据已写入文件：${filePath}`);
}

main();
