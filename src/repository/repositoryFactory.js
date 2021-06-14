const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const tools = require('../util/tools')

const repositories = fs.readdirSync(path.resolve(__dirname))
  .filter(item => _.endsWith(item, '.js'))
  .map(item => tools.trimEndStr(item, '.js'))
  .filter(item => !['repositoryFactory', 'iRepository', 'dao'].includes(item))
  .reduce((pre, filename) => {
    console.debug(filename)
    return _.merge(pre, { [`${_.upperFirst(filename)}`]: require(path.resolve(__dirname, filename)) })
  }, {})

// const assignRepository = (tableName) => {
//   return repositories[tableName]
// }

module.exports = { repositories }
