const BaseWorkman = require('./iWorkman')

class SpiderTimerWorker extends BaseWorkman {
  // constructor(workerName) {
  // }

  async DoWork(input, taskId) {
    this.log.debug(`input is ${JSON.stringify(input)}`)
    return { nextWorker: 'PostEnterPageWorker', data: true }
  }
}

module.exports = SpiderTimerWorker
