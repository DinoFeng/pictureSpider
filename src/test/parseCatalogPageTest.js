// const _ = require('lodash')
const Parser = require('../webParser/xiurenji')
// const tools = require('../util/tools')
const { logger } = require('../util/logger')
const timeout = 30 * 1000
  ;
(async () => {
  const url = 'https://www.xiurenji.net/Micat/index5.html'
  const parser = new Parser()
  const { is404, pages } = await parser.getCatalogPages(url, timeout)
  logger.debug({ is404, pages })
})()
