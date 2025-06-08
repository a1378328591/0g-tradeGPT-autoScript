# 安装依赖
```
npm isntall
```
# 如果版本有问题(可选)
```
npm uninstall ethers   
npm install ethers@5
```

# 配置参数（支持多钱包）
```
# 复制配置文件(示例，手动复制也行)，然后修改.env里的参数
# PRIVATE_KEYS是逗号隔开的私钥串
# CANCEL_PRIVATE_KEY是需要替换交易的私钥（tx卡链就配置这个参数，然后执行node cancelPendingTx.js,值支持配置一个）
cp .env-example .env
```

# 启动自动claim脚本（和swap脚本区分开来，独立运行的），config.js里可以配置多久执行一次，增加了简单的随机性
```
node claim.js
```

# 启动自动swap脚本（里面含简单的claim功能），可以在tokens.js里维护代币合约地址，随机取价值最大的代币的余额*随机% -> 随机token
# main.js的方法loop()可以修改随机的频率，忘了配在config.js了
```
node main.js
```

# 卡链就执行这个命令
```
# .env里配置CANCEL_PRIVATE_KEY参数，只支持配置单个私钥，多个钱包需要替换交易，就修改后再运行
node cancelPendingTx.js
```

