const _ = require('lodash')
const BaseRetryWorker = require('./iRetryErrorLog')

class CheckDownloadErrorLog extends BaseRetryWorker {
  constructor() {
    super('CheckDownloadErrorLog')
  }

  get quque() {
    return 'versatileWorkLines'
  }

  async parseMsgContent(lineContent, logger) {
    const reg = /^.+ ({"data":\S+}) \..+$/ig
    const matchs = reg.exec(lineContent)
    // logger && logger.trace(matchs)
    if (matchs) {
      const [, result] = matchs
      const { data: input } = JSON.parse(result)
      return JSON.stringify({ workType: 'DownloadImageWorker', input: _.omit(input, ['checked']) })
    }
  }
}

(async () => {
  const checker = new CheckDownloadErrorLog()
  checker.doRetry('CheckImageWorker_error_Do.log')
})()
