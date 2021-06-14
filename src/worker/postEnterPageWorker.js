const _ = require('lodash')
const BaseWorkman = require('./iWorkman')
const { Parsers } = require('../webParser/parserFactory')

class PostEnterPageWorker extends BaseWorkman {
  // constructor(workerName) {
  // }

  async DoWork(input, taskId) {
    this.log.debug(`input is ${JSON.stringify(input)}`)
    const urlList = Object.values(Parsers).map((p) => p.getEntryCatalogPages())
    return { data: _.flattenDeep(urlList), nextWorker: 'ParseCatalogPageWorker' }
  }
}

module.exports = PostEnterPageWorker
