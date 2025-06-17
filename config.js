require("dotenv").config();

module.exports = {
  RPC_URL: process.env.RPC_URL,
  PRIVATE_KEYS: process.env.PRIVATE_KEYS,
  ROUTER_ADDRESS: '0xDCd7d05640Be92EC91ceb1c9eA18e88aFf3a6900',
  ABI_PATH: './abi/router.json',
  USDT_ADDRESS: '0x217C6f12d186697b16dE9e1ae9F85389B93BdB30',
  LOG_FILE: './logs/swap.log',

  MIN_DELAY: 2 * 60 * 1000,  //每次swap间隔时间 最小延迟（毫秒）
  MAX_DELAY: 10 * 60 * 1000,  //每次swap间隔时间 最大延迟（毫秒）

  FAUCET_ADDRESS: "0x90DD5F9543Fc4c392f047eA2D3231958D73372dd", //claim合约地址
  FAUCET_ABI_PATH: "./abi/faucet.json",
    CLAIM_LOOP_INTERVAL_MS: 40 * 60 * 1000,      // 40分钟便利一次钱包
  CLAIM_DELAY_BETWEEN_ACCOUNTS_MS: [60_000, 120_000] // 每个账户间延迟范围(成功后才会延迟)：1~2分钟
};
