const { log4js } = require('../util/logger')

const _log = Symbol('_log')
class BaseWorkman {
  constructor() {
    this[_log] = log4js.getLogger(this.workmanName)
  }

  get workmanName() {
    return this.constructor.name
  }

  get log() {
    return this[_log]
  }

  async DoWork(input, taskId) {
    return { data: input, nextWorker: '' }
  }
}
module.exports = BaseWorkman
