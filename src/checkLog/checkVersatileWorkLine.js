const _ = require('lodash')
const BaseRetryWorker = require('./iRetryErrorLog')
const fs = require('fs')
const path = require('path')

class CheckVersatileWorkLineLog extends BaseRetryWorker {
  get quque() {
    return 'VersatileWorkLine_man1'
    // return 'versatileWorkLines'
  }

  async parseMsgContent(lineContent, logger) {
    const reg = /^\[\S+\] \[MARK\] \w+ - (.+)$/ig
    const matchs = reg.exec(lineContent)
    // logger && logger.trace(matchs)
    if (matchs) {
      const [, result] = matchs
      const { msgContent } = JSON.parse(result)
      const data = _.merge({}, JSON.parse(msgContent), { retry: 0 })
      return JSON.stringify(data)
      // return JSON.stringify({ workType: 'DownloadImageWorker', input })
    }
  }
}

(async () => {
  const checker = new CheckVersatileWorkLineLog()
  const files = fs.readdirSync(path.resolve('retry'))
  for (const file of files) {
    console.debug(file)
    await checker.doRetry(file).then(() => {
      fs.renameSync(path.resolve(`retry\\${file}`), path.resolve(`done\\${file}`))
      console.debug(`removed file:${file}`)
    })
  }
  // files.forEach(file => {
  // const file = 'VersatileWorkLine_man7.2021-03-05.mark.log'

  console.debug('end')
  // })
})()
