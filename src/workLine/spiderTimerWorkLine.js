const NormalWorkLine = require('./iNormalWorkLine')

class SpiderTimerWorkLine extends NormalWorkLine {
  get workerName() {
    return 'SpiderTimerWorker'
  }

  get maxRetries() {
    return 2
  }

  get nextQueue() {
    return 'spiderTimerQueue'
  }

  get bindExchange() {
    const name = 'spiderTimerExchange'
    return {
      name,
      type: '',
    }
  }
}

module.exports = SpiderTimerWorkLine
