require('dotenv').config();
const { ethers } = require("ethers");

// 0G 测试网 RPC 和合约地址
const RPC_URL = 'https://evmrpc-testnet.0g.ai';
const STAKING_CONTRACT = '0xea224dBB52F57752044c0C86aD50930091F561B9';

// ✅ 使用 CLI 工具生成的新 pubkey 和 signature
const pubkeyHex = 'xxxx';
const signatureHex = 'xxxx';

//之前测试验证者跑不了，因为要质押32个0g代币 
// 验证者描述信息
const description = {
  moniker: "qxyl",
  identity: "qxyl",
  website: "https://x.com/Wei_Lao_",
  securityContact: "weilao0113@gmail.com",
  details: "https://medium.com/@weilao0113"
};

const commissionRate = 50000;      // 5%
const withdrawalFeeInGwei = 1;     // 1 Gwei

async function main() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const privateKey = process.env.CREATE_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("请在 .env 文件中设置 CREATE_PRIVATE_KEY");
    }
    const signer = new ethers.Wallet(privateKey, provider);

    const stakingAbi = [
      "function createAndInitializeValidatorIfNecessary(tuple(string moniker,string identity,string website,string securityContact,string details) description,uint32 commissionRate,uint96 withdrawalFeeInGwei,bytes pubkey,bytes signature) payable",
      "function effectiveDelegationInGwei() view returns (uint96)"
    ];

    const stakingContract = new ethers.Contract(STAKING_CONTRACT, stakingAbi, signer);

    // 查询当前最小质押
    const minStake = await stakingContract.effectiveDelegationInGwei();
    console.log("合约当前最小质押 (Gwei):", minStake.toString());

    // ✅ 提交略高于最小质押的金额
    const stakingValue = ethers.utils.parseUnits("1001000000", "gwei"); // = 1.001 0G
    console.log("提交的质押金额 (wei):", stakingValue.toString());

    // 检查质押值是否满足最小质押
    if (stakingValue.lt(minStake)) {
      throw new Error(`质押金额不足，最小要求: ${minStake.toString()} Gwei`);
    }

    const pubkey = ethers.utils.arrayify(pubkeyHex);
    const signature = ethers.utils.arrayify(signatureHex);

    console.log("开始发送质押交易...");

    const tx = await stakingContract.createAndInitializeValidatorIfNecessary(
      description,
      commissionRate,
      withdrawalFeeInGwei,
      pubkey,
      signature,
      { value: stakingValue }
    );

    console.log("交易哈希:", tx.hash);
    await tx.wait();
    console.log("✅ 验证者创建并初始化成功！");
  } catch (error) {
    console.error("❌ 执行出错:", error);
  }
}

main();
