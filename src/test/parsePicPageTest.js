// const _ = require('lodash')
const Parser = require('../webParser/xiurenji')
// const tools = require('../util/tools')
const { logger } = require('../util/logger')
const timeout = 30 * 1000
  ;
(async () => {
  const url = 'https://www.xiurenji.net/Micat/2017_8.html'
  const parser = new Parser()
  const { is404, images } = await parser.getPicUrlFromPicPage(url, timeout)
  logger.debug({ is404, images })
})()
