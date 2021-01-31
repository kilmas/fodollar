const CONTRACT = 'fdisfodollar'

const fopairPrimary = 0
const loanRate = 0.0004
const lockRate = 1.6
const clearRate = 1.5

const permissions = [
  {
    actor: CONTRACT,
    permission: 'active',
  },
]

function tokenExissue(to, value) {
  trans.send_inline(
    'eosio.token',
    'exissue',
    {
      to: to,
      quantity: {
        quantity: `${value} FD`,
        contract: CONTRACT,
      },
      memo: `exissue FD to ${to}`,
    },
    permissions
  )
}

function tokenTransfer(to, quantity, memo) {
  trans.send_inline(
    'eosio.token',
    'transfer',
    {
      from: CONTRACT,
      to,
      quantity,
      memo,
    },
    permissions
  )
}

function getConfig(id) {
  const configs = db.configs(CONTRACT, CONTRACT)
  const config = configs.find(id)
  return config
}

function getLoanRate() {
  const config = getConfig(0)
  return config.data ? config.data.data : loanRate
}

function getLockRate() {
  const config = getConfig(1)
  return config.data ? config.data.data : lockRate
}

function getClearRate() {
  const config = getConfig(2)
  return config.data ? config.data.data : clearRate
}

function getFOPrice() {
  const swapmarket = db.swapmarket('eosio.token', 'eosio.token')
  const swapPair = swapmarket.find(fopairPrimary)
  assert(!!swapPair.data, 'no swap pair data')
  const {
    tokenx: { quantity: quantityx },
    tokeny: { quantity: quantityy },
  } = swapPair.data
  const xAsset = quantityx.split(' ')
  const yAsset = quantityy.split(' ')
  assert(xAsset[1] === 'FOUSDT' && yAsset[1] === 'FO', 'not right swap pair')
  const usdtprice = Number(xAsset[0])
  const foprice = Number(yAsset[0])
  const price = usdtprice / foprice
  return price
}

const indexes = {
  account: [64, o => [o.account]],
}

function getMint(id) {
  const mints = db.mints(CONTRACT, CONTRACT, indexes)
  const mint = mints.find(id)
  assert(!!mint.data, 'no mint data')
  return mint
}

function mint(from, quantity, rate, foPrice) {
  const asset = quantity.split(' ')
  assert(Number(asset[0]) >= 10000, 'mint must usdt > 10000 FO')
  assert(rate >= 2, 'rate must usdt <= 0.5')
  const price = getFOPrice()
  assert(foPrice < price * 1.1 && foPrice > price * 0.9, 'foPrice must be nearly')
  const value = Number((asset[0] * price) / rate).toFixed(6)
  const mints = db.mints(CONTRACT, CONTRACT, indexes)
  const id = mints.get_primary_key()
  mints.emplace(CONTRACT, {
    id,
    account: from,
    amount: quantity,
    rate,
    value: `${value} FD`,
    status: '0',
    time: Number(action.publication_time),
    ctime: 0,
  })
  tokenExissue(from, value)
}

function burnMint(value) {
  trans.send_inline(
    'eosio.token',
    'exretire',
    {
      from: CONTRACT,
      quantity: {
        quantity: value,
        contract: CONTRACT,
      },
      memo: 'exretire FD',
    },
    permissions
  )
}

function returnFO(mint, from, price, loanTime) {
  // One day is 86400000000
  const { amount, value } = mint.data
  const loadDays = Math.ceil(loanTime / 86400000000)
  const amountAsset = amount.split(' ')
  const valueAsset = value.split(' ')
  const value0 = valueAsset[0] * loadDays * getLoanRate() // loanRate
  const aAsset = Number(amountAsset[0]) - value0 / price
  tokenTransfer(from, `${aAsset.toFixed(4)} FO`, `return fo asset`)
  mint.remove()
}

function burn(id, from, quantity) {
  const mint = getMint(id)
  const { account, value, time } = mint.data
  assert(account === from, 'account must equal')
  assert(quantity === value, 'quantity must equal')
  const foPrice = getFOPrice()
  burnMint(value)
  const currentTime = Number(action.publication_time)
  const loanTime = currentTime - Number(time)
  returnFO(mint, from, foPrice, loanTime)
}

function feed(id, from, quantity) {
  const qAsset = quantity.split(' ')
  const mint = getMint(id)
  const { amount, account, value } = mint.data
  assert(account === from, 'must feed by self')
  const vAsset = value.split(' ')
  const foPrice = getFOPrice()
  
  const nAmount = Number(amount.split(' ')[0]) + Number(qAsset[0])
  const aValue = nAmount * foPrice
  // assert(aValue >= 2 * Number(vAsset[0]), "feed FO is not enough")
  mint.data.amount = `${nAmount.toFixed(4)} FO`
  if (aValue >= Number(vAsset[0] * 1.6)) {
    mint.data.status = '0'
    mint.data.ctime = 0
  }
  mint.update(CONTRACT)
}

function clearFD(id, from, quantity) {
  const cmints = db.cmints(CONTRACT, CONTRACT, indexes)
  const cmint = cmints.find(id)
  assert(!!cmint.data, 'no mint data')
  const { value, account } = cmint.data
  const vAsset = value.split(' ')
  assert(account === from, 'clear is self')
  assert(quantity === value, 'must quantity === FD')
  burnMint(value)
  tokenTransfer(from, `${vAsset[0]} FOUSDT`, `return FOUSDT`)
  cmint.remove()
}

function clearByUsdt(id, from, quantity) {
  const mint = getMint(id)
  const foPrice = getFOPrice()
  const { amount, value, status, ctime, time, account } = mint.data
  const aAsset = amount.split(' ')
  const vAsset = value.split(' ')
  const clearValue = (Number(aAsset[0]) * foPrice) / getClearRate() // clearRate
  assert(clearValue < Number(vAsset[0]), "can't clear")
  assert(account !== from, 'clear is self')
  const currentTime = Number(action.publication_time)
  const dtime = currentTime - Number(ctime)
  const hour = ((currentTime / 1000000) % (3600 * 24)) / 3600
  let dftime = 3600000000
  if (hour > 16 && hour <= 24) {
    dftime = 3600000000 * 8
  }
  assert(dtime > dftime, 'differ time must be > 3600s or 3600s * 8 when in chinese night')
  const loanTime = currentTime - Number(time)
  assert(status === '1' || loanTime > 86400000000 * 365, "status can't clear")
  assert(Number(quantity[0]) === Number(vAsset[0]), 'must quantity === USDT')
  const cmints = db.cmints(CONTRACT, CONTRACT, indexes)
  const cid = cmints.get_primary_key()
  cmints.emplace(CONTRACT, {
    id: cid,
    account,
    clearer: from,
    amount,
    value,
    time: currentTime,
  })
  returnFO(mint, from, foPrice, loanTime)
}

exports.setconfig = (id, data) => {
  action.require_auth(CONTRACT)
  const configs = db.configs(CONTRACT, CONTRACT)
  const config = configs.find(id)
  if (config.data) {
    config.data.data = data
  } else {
    configs.emplace(CONTRACT, {
      id: id,
      data: data,
    })
  }
}

exports.lock = id => {
  const mint = getMint(id)
  const price = getFOPrice()
  const { amount, value, status } = mint.data
  const aAsset = amount.split(' ')
  const vAsset = value.split(' ')
  const clearValue = (Number(aAsset[0]) * price) / getLockRate() // lockRate
  assert(clearValue < Number(vAsset[0]), "can't lock")
  assert(status === '0', 'status must be 0')
  mint.data.status = '1'
  mint.data.ctime = action.publication_time
  mint.update(CONTRACT)
}

exports.on_transfer = (from, to, quantity, memo) => {
  if (action.account === 'eosio.token' && to === CONTRACT) {
    const asset = quantity.split(' ')
    const [type, idorrate, foPrice] = memo.split(',')
    if (asset[1] === 'FO') {
      if (type === '1') {
        mint(from, quantity, Number(idorrate), Number(foPrice))
      } else if (type === '3') {
        feed(Number(idorrate), from, quantity)
      }
    } else if (type === '4' && asset[1] === 'FOUSDT') {
      clearByUsdt(Number(idorrate), from, asset)
    }
  }
}

exports.on_extransfer = (from, to, quantity, memo) => {
  const contract = quantity['contract']
  if (contract !== CONTRACT || to !== CONTRACT) {
    return
  }
  const [type, id] = memo.split(',')
  if (action.account === 'eosio.token') {
    const qty = quantity['quantity']
    const asset = qty.split(' ')
    if (asset[1] === 'FD') {
      if (type === '2') {
        burn(Number(id), from, qty)
      } else if (type === '5') {
        clearFD(Number(id), from, qty)
      }
    }
  }
}
