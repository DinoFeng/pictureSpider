const NormalWorkLine = require('./iNormalWorkLine')

class ParsePicPageWorkLine extends NormalWorkLine {
  get workerName() {
    return 'ParsePicPageWorker'
  }

  get maxRetries() {
    return 2
  }

  get exportExchange() {
    const name = 'exportDowloadInfo'
    return {
      name,
      type: '',
    }
  }

  get bindExchange() {
    const name = 'exportImageUrlInfo'
    return {
      name,
      type: '',
    }
  }
}

module.exports = ParsePicPageWorkLine
