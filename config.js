require("dotenv").config();

module.exports = {
  RPC_URL: process.env.RPC_URL,
  PRIVATE_KEYS: process.env.PRIVATE_KEYS,
  ROUTER_ADDRESS: '0xdcd7d05640be92ec91ceb1c9ea18e88aff3a6900',
  ABI_PATH: './abi/router.json',
  USDT_ADDRESS: '0xe6c489b6d3eeca451d60cfda4782e9e727490477',
  LOG_FILE: './logs/swap.log',

  FAUCET_ADDRESS: "0xdE56D007B41a591C98dC71e896AD0a844356e584", //claim合约地址
  FAUCET_ABI_PATH: "./abi/faucet.json",
    CLAIM_LOOP_INTERVAL_MS: 40 * 60 * 1000,      // 40分钟便利一次钱包
  CLAIM_DELAY_BETWEEN_ACCOUNTS_MS: [60_000, 120_000] // 每个账户间延迟范围(成功后才会延迟)：1~2分钟
};
