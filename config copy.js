require('dotenv').config();

module.exports = {
  RPC_URL: process.env.RPC_URL,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  ROUTER_ADDRESS: '0xdcd7d05640be92ec91ceb1c9ea18e88aff3a6900',
  TOKEN_A: '0xe6c489b6d3eeca451d60cfda4782e9e727490477', // 替换为实际 token 地址
  TOKEN_B: '0x8b1b701966cfdd5021014bc9c18402b38091b7a8', // 替换为实际 token 地址
  ABI_PATH: './abi/router.json',
};
