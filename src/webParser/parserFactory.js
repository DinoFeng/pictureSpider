const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const tools = require('../util/tools')

const URL = require('url').URL

// const WebParsers = fs
//   .readdirSync(path.resolve(__dirname))
//   .filter((item) => _.endsWith(item, '.js'))
//   .map((item) => tools.trimEndStr(item, '.js'))
//   .filter((item) => !['parserFactory', 'iWebParser', 'taotu8', 'xsnvshen'].includes(item))
//   .reduce((pre, filename) => {
//     // const paser = require(path.resolve(__dirname, filename))
//     // return _.merge(pre, paser.historyHosts.reduce((preParser, host) => {
//     //   return _.merge(preParser, { [host]: paser })
//     // }, {}))
//     return _.merge(pre, { [`${_.upperFirst(filename)}`]: require(path.resolve(__dirname, filename)) })
//   }, {})

const Parsers = fs
  .readdirSync(path.resolve(__dirname))
  .filter((item) => _.endsWith(item, '.js'))
  .map((item) => tools.trimEndStr(item, '.js'))
  .filter((item) => !['parserFactory', 'iWebParser'].includes(item))
  .reduce((pre, filename) => {
    const Parser = require(path.resolve(__dirname, filename))
    const paser = new Parser()
    return _.merge(pre, { [`${paser.curHost}`]: paser })
  }, {})

const getParser = (url, log) => {
  const host = new URL(url).host
  log && log.trace({ host })
  const p = Parsers[host]
  // if (Parser) {
  //   const p = new Parser(log)
  //   return p
  // }
  return p
}

module.exports = { getParser, Parsers }
