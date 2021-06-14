const _ = require('lodash')
const BaseWorkman = require('./iWorkman')
const { getParser } = require('../webParser/parserFactory')
const baseTimeout = 30 * 1000

class ParseTotalPicPageWorker extends BaseWorkman {
  // constructor(workerName) {
  // }

  async DoWork(input, taskId) {
    this.log.debug(`input is ${JSON.stringify(input)}`)
    const { data: { href: url }, retry } = input || {}
    if (url) {
      const timeout = retry ? 2 * baseTimeout : baseTimeout
      const parser = getParser(url, this.log)
      const { is404, pages } = await parser.getTotalPicPageUrl(url, timeout)
      if (!is404) {
        if (pages && pages.length > 0) {
          return { data: pages.map(page => _.merge({}, { page }, { sourcePage: url })), nextWorker: 'ParsePicPageWorker' }
        } else {
          this.log.error(`${taskId} Process done. ${url}  is't 404, but no any page number info.`)
        }
      } else {
        this.log.warn(`${taskId} Process done. ${url} is 404. no any pic info`)
      }
    } else {
      this.log.fatal(`${taskId} Process done. Input data ${JSON.stringify(input)} is invalid.`)
      return null
    }
  }
}

module.exports = ParseTotalPicPageWorker
