# extract Smart Contract

合约名称为: foaccountids, 可以自行导出合约

## Install

$`curl -s https://fibos.io/download/installer.sh | sh`

$`$fibos --install`

## Extract

```
let extract = require("./extract");

extract("foaccountids", {
	env: "mainnet",
	path: "./dapppath"
});
```

`fibos ...`

## Deploy

Install
use yarn, not npm install

`yarn`

testNet

`fibos deploy.js test`

定时充值脚本

`node fibosokusdt.js test proxy`

定时提现脚本

`node fibostousdt.js test proxy`

prod

`fibos deploy.js prod`

定时充值脚本

`node fibosokusdt.js prod`

定时提现脚本

`node fibostousdt.js prod`
