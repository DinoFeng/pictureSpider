const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const tools = require('../util/tools')

const workmans = fs.readdirSync(path.resolve(__dirname))
  .filter(item => _.endsWith(item, '.js'))
  .map(item => tools.trimEndStr(item, '.js'))
  .filter(item => !['workmanFactory', 'iWorkman'].includes(item))
  .reduce((pre, filename) => {
    return _.merge(pre, { [`${_.upperFirst(filename)}`]: require(path.resolve(__dirname, filename)) })
  }, {})

const assignWorker = (workType) => {
  const Workman = workmans[workType]
  if (Workman) {
    const w = new Workman()
    return w
  }
}

module.exports = { assignWorker }
