require("dotenv").config();
const { ethers } = require("ethers");

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.CANCEL_PRIVATE_KEY;

if (!PRIVATE_KEY || !RPC_URL) {
  console.error("❌ 请确保 .env 中配置了 CANCEL_PRIVATE_KEY 和 RPC_URL");
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

(async () => {
  try {
    const latestNonce = await provider.getTransactionCount(wallet.address, "latest");
    const pendingNonce = await provider.getTransactionCount(wallet.address, "pending");

    console.log(`🧾 钱包地址: ${wallet.address}`);
    console.log(`🔢 latest nonce: ${latestNonce}, pending nonce: ${pendingNonce}`);

    if (pendingNonce <= latestNonce) {
      console.log("✅ 没有卡住的 pending 交易，无需替换");
      return;
    }

    const gasPrice = ethers.utils.parseUnits("2.0", "gwei");

    for (let nonce = latestNonce; nonce < pendingNonce; nonce++) {
      console.log(`🚀 替换 pending nonce=${nonce} ...`);
      const tx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0,
        nonce,
        gasLimit: 21000,
        gasPrice
      });
      console.log(`⏳ 等待确认 tx: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ nonce=${nonce} 替换成功，区块号: ${receipt.blockNumber}`);
    }

    console.log("🎉 所有 pending 交易已清除完毕");
  } catch (err) {
    console.error("❌ 替换过程中出错:", err.message || err);
  }
})();
