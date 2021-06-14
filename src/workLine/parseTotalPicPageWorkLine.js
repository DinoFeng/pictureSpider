const NormalWorkLine = require('./iNormalWorkLine')

class ParseTotalPicPageWorkLine extends NormalWorkLine {
  get workerName() {
    return 'ParseTotalPicPageWorker'
  }

  get maxRetries() {
    return 2
  }

  get exportExchange() {
    const name = 'exportImageUrlInfo'
    return {
      name,
      type: '',
    }
  }

  get bindExchange() {
    const name = 'exportCatalogPageInfo'
    return {
      name,
      type: '',
    }
  }
}

module.exports = ParseTotalPicPageWorkLine
