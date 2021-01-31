const FIBOS = require('fibos.js')
var config_data = require('./config.js')
var config = config_data.test
if (process.argv[2]) {
  if (process.argv[2] === 'prod') {
    config = config_data.prod
  } else if (process.argv[2] === 'test') {
    config = config_data.test
  }
}
// 发行FD
var name = config.contract

fibos = FIBOS({
  chainId: config.chainId,
  keyProvider: config.privateKey,
  httpEndpoint: config.httpEndpoint,
  logger: {
    log: null,
    error: null,
  },
})

let ctx = fibos.contractSync('eosio.token')

let time = new Date()
time.setTime(time.getTime() + 10000)
let r 
r = ctx.excreateSync(name, '10000000000.000000 FD', 0, '0.000000 FD', '0.000000 FD', '0.0000 FO', time.toISOString().substring(0, 19), 0, 0, 'eosio', {
  authorization: name
});
console.log(r)
r = ctx.setpositionSync(`0.000000 FD@${name}`, 1, 'set postion state to true', {
  authorization: name
}); // 第二个参数为 1 表示开仓，0 表示关仓
console.log(r);