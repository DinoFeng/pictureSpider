const _ = require('lodash')
const BaseWorkman = require('./iWorkman')
const tools = require('../util/tools')
const baseTimeout = 30 * 1000

class DownloadImageWorker extends BaseWorkman {
  // constructor(workerName) {
  // }

  async DoWork(input, taskId) {
    this.log.debug(`input is ${JSON.stringify(input)}`)
    const { data: downloadInfo, retry } = input || {}
    const { picUrl, folder, fileName, headers, extName } = downloadInfo || {}
    if (folder && (picUrl || fileName)) {
      const timeout = retry ? 2 * baseTimeout : baseTimeout
      const proxy = retry && tools.checkProxy()
      const filePath = await tools.saveUrlToFile(picUrl, { timeout, headers, proxy }, { folder, fileName, extName, timeout })
      return { data: _.merge({}, downloadInfo, { filePath }), nextWorker: 'CheckImageWorker' }
      // return { data: { filePath }, nextWorker: 'CheckImageWorker' }
    } else {
      this.log.fatal(`${taskId} Process done. Input data ${JSON.stringify(input)} is invalid.`)
      return null
    }
  }
}

module.exports = DownloadImageWorker
