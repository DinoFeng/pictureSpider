const NormalWorkLine = require('./iNormalWorkLine')

class ParseTotalPicPageWorkLine extends NormalWorkLine {
  get workerName() {
    return 'PostEnterPageWorker'
  }

  get maxRetries() {
    return 2
  }

  get exportExchange() {
    const name = 'exportEnterPageInfo'
    return {
      name,
      type: '',
    }
  }

  get bindExchange() {
    const name = 'spiderTimerExchange'
    return {
      name,
      type: '',
    }
  }
}

module.exports = ParseTotalPicPageWorkLine
