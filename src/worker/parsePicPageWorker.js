const _ = require('lodash')
const BaseWorkman = require('./iWorkman')
const { getParser } = require('../webParser/parserFactory')
const baseTimeout = 30 * 1000

class ParsePicPageWorker extends BaseWorkman {
  // constructor(workerName) {
  // }

  async DoWork(input, taskId) {
    this.log.debug(`input is ${JSON.stringify(input)}`)
    const { data: { page, sourcePage }, retry } = input || {}
    if (page) {
      const timeout = retry ? 2 * baseTimeout : baseTimeout
      const parser = getParser(page, this.log)
      const { is404, images } = await parser.getPicUrlFromPicPage(page, timeout)
      if (!is404) {
        if (images && images.length > 0) {
          return { data: images.map(image => _.merge(image, { sourcePage })), nextWorker: 'DownloadImageWorker' }
        } else {
          this.log.error(`${taskId} Process done. ${page}  is't 404, but no any image info.`)
          // throw new Error(`${page}  is't 404, but no any image info.`)
        }
      } else {
        this.log.warn(`${taskId} Process done. ${page} is 404. no any pic info`)
      }
    } else {
      this.log.fatal(`${taskId} Process done. Input data ${JSON.stringify(input)} is invalid.`)
      return null
    }
  }
}

module.exports = ParsePicPageWorker
