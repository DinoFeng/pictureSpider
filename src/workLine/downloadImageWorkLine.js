const NormalWorkLine = require('./iNormalWorkLine')

class DownloadImageWorkLine extends NormalWorkLine {
  get workerName() {
    return 'DownloadImageWorker'
  }

  get maxRetries() {
    return 2
  }

  get exportExchange() {
    const name = 'exportDowloadedFileInfo'
    return {
      name,
      type: '',
    }
  }

  get bindExchange() {
    const name = 'exportDowloadInfo'
    return {
      name,
      type: '',
    }
  }
}

module.exports = DownloadImageWorkLine
