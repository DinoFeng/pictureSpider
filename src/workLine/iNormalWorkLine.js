const _ = require('lodash')
const BaseWorkLine = require('./iWorkLine')
const { assignWorker } = require('../worker/workmanFactory')

class NormalWorkLine extends BaseWorkLine {
  constructor(workLineName) {
    super({ address: 'amqp://localhost', workLineName })
    if (!this.workerName) {
      throw new Error('workerName not set!')
    }
  }

  get workerName() {
    return null
  }

  async runWork(data, taskId, self) {
    const worker = assignWorker(self.workerName)
    if (worker) {
      return await worker.DoWork(data, taskId)
    } else {
      throw new Error(`'${self.workerName}' is invalid worker name`)
    }
  }

  displayResult(result, taskId) {
    this.log.debug(`${taskId} result is:`, result)
  }

  async doFeature(msg, channel, taskId) {
    const jobContent = this.parseMessageContent(msg)
    if (jobContent) {
      const { input } = jobContent
      const result = await this.runWork({ data: input, retry: msg.fields.redelivered }, taskId, this)
      if (result) {
        this.displayResult(result, taskId)
        const { data, nextWorker } = result
        if (data) {
          const sendDatas = _.isArray(data) ? data : [data]
          // 广播返回Result
          if (_.get(this.exportExchange, 'name')) {
            try {
              const key = _.isFunction(this.exportExchange.key) ? this.exportExchange.key(msg) : ''
              await Promise.all(
                sendDatas.map(item =>
                  channel.publish(this.exportExchange.name, key, Buffer.from(JSON.stringify({ workType: nextWorker, input: item })), { persistent: true }),
                ),
              )
              // await channel.publish(this.exportExchange.name, key, Buffer.from(JSON.stringify(result)), { persistent: true })
            } catch (e) {
              this.log.error(e)
            }
          }
          // 或向下级Queue send msg
          if (this.nextQueue) {
            await Promise.all(
              sendDatas.map(item =>
                channel.sendToQueue(this.nextQueue, Buffer.from(JSON.stringify({ workType: nextWorker, input: item })), { persistent: true }),
              ),
            )
            // await channel.sendToQueue(this.nextQueue, Buffer.from(JSON.stringify(result)), { persistent: true })
          }
        }
        await channel.ack(msg) // 消化
        return true
      } else {
        await channel.reject(msg, false) // 丢弃
        return false
      }
    } else {
      this.deadLineHandling(msg, new Error('Invalid message.'))
      await channel.reject(msg, false) // 丢弃
      return false
    }
  }
}

module.exports = NormalWorkLine
