require("dotenv").config();

module.exports = {
  RPC_URL: process.env.RPC_URL,
  PRIVATE_KEYS: process.env.PRIVATE_KEYS,
  ROUTER_ADDRESS: '0xDCd7d05640Be92EC91ceb1c9eA18e88aFf3a6900',
  ABI_PATH: './abi/router.json',
  USDT_ADDRESS: '0x217C6f12d186697b16dE9e1ae9F85389B93BdB30',
  LOG_FILE: './logs/swap.log',

  MIN_DELAY: 3 * 60 * 1000,  //每次swap间隔时间 最小延迟（这里指的最少间隔3分钟）
  MAX_DELAY: 5 * 60 * 1000,  //每次swap间隔时间 最大延迟（这里指的最大间隔5分钟）

  FAUCET_ADDRESS: "0x75d4225b61324EA006582456F3871A6c16e99034", //claim合约地址
  FAUCET_ABI_PATH: "./abi/faucet.json",
  CLAIM_LOOP_INTERVAL_MS: 40 * 60 * 1000,      // 40分钟遍历一次钱包
  CLAIM_DELAY_BETWEEN_ACCOUNTS_MS: [300_000, 600_000], // 每个账户领水间延迟范围(成功后才会延迟，tradegpt的领水)：300~600秒

  DEPOSIT_ABI_PATH: "./abi/deposit.json",
  STAKE_CONTRACT_ADDRESS: '0x3bE9d3C9d313B580d0157Bf0B10fFCB8B92F04D4',
  DEPOSIT_MIN_SLEEP_MS: 2 * 60 * 1000, //deposit间隔
  DEPOSIT_MAX_SLEEP_MS: 10 * 60 * 1000
};
