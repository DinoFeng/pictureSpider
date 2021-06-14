const _ = require('lodash')
const tools = require('../util/tools')
const Rabbit = require('../util/rabbit')
const { log4js } = require('../util/logger')

const _workLineName = Symbol('_workLineName')
const _mqAddress = Symbol('_mqAddress')
const _queueName = Symbol('_queueName')
const _connection = Symbol('_connection')
const _log = Symbol('_log')
class BaseWorkLine {
  constructor({ address, workLineName }) {
    this[_workLineName] = workLineName
    this[_mqAddress] = address
    this[_log] = log4js.getLogger(workLineName)
  }

  get connection() {
    return this[_connection]
  }

  get workLineName() {
    return this[_workLineName]
  }

  get address() {
    return this[_mqAddress]
  }

  get queueName() {
    return this[_queueName]
  }

  get exportExchange() {
    return {
      name: '',
      type: '',
      key: msg => { return null },
    }
  }

  get bindExchange() {
    return {
      name: '',
      type: '',
      key: '',
    }
  }

  get nextQueue() {
    return null
  }

  get maxRetries() {
    return 0
  }

  get prefetchSize() {
    return 1
  }

  get log() {
    return this[_log]
  }

  startConsumer(queueName) {
    this[_queueName] = queueName
    const log = this.log
    // amqp.connect(this.address, { clientProperties: { connection_name: this.hostName } })
    //   .then(cnn => cnn.createChannel())
    new Rabbit({ address: this.address, hostName: this.workLineName })
      .then(rabbit => {
        this[_connection] = rabbit.connection
        return rabbit.connection.createChannel()
      })
      .then(async channel => {
        if (_.get(this.exportExchange, 'name')) {
          await channel.assertExchange(this.exportExchange.name, _.get(this.exportExchange, 'type') || 'fanout', { durable: false })
        }

        await channel.assertQueue(queueName, { durable: true }) // durable: 持久化
          .then(async q => {
            if (_.get(this.bindExchange, 'name')) {
              await channel.assertExchange(this.bindExchange.name, _.get(this.bindExchange, 'type') || 'fanout', { durable: false })
              await channel.bindQueue(q.queue, this.bindExchange.name, _.get(this.bindExchange, 'key') || '')
            }
          })
        // , (err, q) => {
        // if (err) { throw err }
        // this.log.debug(this.bindExchange)

        // })
        await channel.prefetch(this.prefetchSize) // 该 scheduler 一次只接收一个 msg，old msg ack 后，接收新的 task
        await this.beforeConsume()
        log.info(` [*] Waiting for messages in ${queueName}. To exit press CTRL+C`)
        await channel.consume(queueName, async msg => {
          if (msg != null) {
            const taskId = tools.genUUID()
            log.time(taskId)
            log.debug(`${taskId} Recieve msg. Begin Process...`)
            try {
              await this.doFeature(msg, channel, taskId)
            } catch (error) {
              await this.errorHandling(msg, channel, error, taskId)
            } finally {
              log.debug(`${taskId} Process Done.`)
              log.timeEnd(taskId)
            }
          } else {
            log.info('msg is null.')
          }
        }, { noAck: false })
      })
  }

  async beforeConsume() { }

  async doFeature(msg, channel, taskId) {
  }

  async errorHandling(msg, channel, error, taskId) {
    this.log.error(`${taskId} Process error!`, error)
    if (msg.fields.redelivered) {
      if (this.maxRetries > 0) {
        await this.retryHandling(msg, channel, error, taskId)
      } else {
        await this.deadLineHandling(msg, error, taskId)
      }
      await channel.reject(msg, false) // 丟弃msg
    } else {
      await channel.reject(msg, true) // 重试
    }
  }

  async retryHandling(msg, channel, error, taskId) {
    const content = this.parseMessageContent(msg)
    const retry = _.get(content, 'retry') || 0
    if (retry > this.maxRetries) {
      await this.deadLineHandling(msg, error, taskId)
    } else {
      const retryData = _.merge({}, content, { retry: retry + 1 })
      await channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(retryData)), { persistent: true })
      // 或者通过Exchange广播出去，下一步研究
    }
  }

  async deadLineHandling(msg, error, taskId) {
    const { name, message, stack, config } = error
    this.log.mark(JSON.stringify({ msgContent: msg.content.toString(), error: { name, message, stack, config } }))
  }

  parseMessageContent(msg) {
    try {
      const content = JSON.parse(msg.content.toString())
      this.log.debug({ content })
      return content
    } catch (e) {
      return null
    }
  }
}

module.exports = BaseWorkLine
