const NormalWorkLine = require('./iNormalWorkLine')
const { assignWorker } = require('../worker/workmanFactory')

class AdoWorkLine extends NormalWorkLine {
  get dbFilePath() {
    return __dirname
  }

  get ADO() {
    return null
  }

  get repositories() {
    return null
  }

  async runWork(data, taskId, self) {
    const worker = assignWorker(self.workerName)
    if (worker) {
      return await worker.DoWork(data, taskId, self.repositories)
    } else {
      throw new Error(`'${self.workerName}' is invalid worker name`)
    }
  }
}

module.exports = AdoWorkLine
