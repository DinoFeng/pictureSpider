const Rabbit = require('../util/rabbit')
const { log4js } = require('../util/logger')

const _log = Symbol('_log')
class BaseRetryWorker {
  constructor() {
    this[_log] = log4js.getLogger(this.taskName)
  }

  get log() {
    return this[_log]
  }

  get taskName() {
    return this.constructor.name
  }

  get quque() {
    return ''
  }

  async parseMsgContent(lineContent, logger) {
    return ''
  }

  async doRetry(logFile) {
    return new Promise((resolve, reject) => {
      return new Rabbit({ address: 'amqp://localhost', hostName: this.taskName })
        .then(rabbit =>
          rabbit.connection.createChannel()
            .then(async channel => {
              const readline = require('linebyline')
              const rl = readline(`retry\\${logFile}`)
              return rl.on('line', async (line, lineCount, byteCount) => {
                this.log.trace({ lineCount })
                const msgContent = await this.parseMsgContent(line, this.log)
                if (msgContent && this.quque) {
                  await channel.sendToQueue(this.quque, Buffer.from(msgContent), { persistent: true })
                  this.log.info(`${lineCount}: ${msgContent}`)
                }
              }).on('error', (e) => {
                this.log.error(e)
                reject(e)
              }).on('close', async () => {
                this.log.info(`${logFile} Close.`)
                resolve()
              })
            }),
        )
    })
  }
}
module.exports = BaseRetryWorker
