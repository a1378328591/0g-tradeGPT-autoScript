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

# 启动自动claim脚本（和swap脚本区分开来，独立运行的），config.js里可以配置多久执行一次，增加了简单的随机性（随机打乱钱包顺序+随机间隔）
```
node claim.js
```

# 启动自动swap脚本（里面含简单的claim功能），可以在tokens.js里维护代币合约地址，随机取价值最大的代币的余额*随机% -> 随机token
# main.js： 随机swap（随机钱包+随机间隔+随机百分比金额+随机交易对），每次成功后都会调用官方的log事件（官方根据这个来统计分数的，第一周的任务测试过）
```
node main.js
```

# 卡链就执行这个命令
```
# .env里配置CANCEL_PRIVATE_KEY参数，只支持配置单个私钥，多个钱包需要替换交易，就修改后再运行
node cancelPendingTx.js
```

# 查看排名，输出到logs/rank.txt里（简单的列表展示：钱包 积分 排名 更新时间）
```
node rank_query.js
```

# deposit: 随机钱包+随机间隔  执行完就自动停止脚本，没做轮训
```
node rank_query.js
```