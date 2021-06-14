const _ = require('lodash')
const { assignWorker } = require('../worker/workmanFactory')
const BaseWorker = require('./iWorkLine')
const DAO = require('../repository/dao')
const { repositories } = require('../repository/repositoryFactory')

const _dao = Symbol('_dao')
const _repositories = Symbol('_repositories')
class VersatileWorkLine extends BaseWorker {
  constructor(workerName) {
    super({ address: 'amqp://localhost', workLineName: workerName })
  }

  // get nextQueue() {
  //   return ''
  // }

  get maxRetries() {
    return 2
  }

  get dbFilePath() {
    return process.env.DB_FILE || './db/PicLib.db'
  }

  get ADO() {
    return this[_dao]
  }

  get repositories() {
    return this[_repositories]
  }

  async beforeConsume() {
    this[_dao] = await new DAO(this.dbFilePath)

    this[_repositories] = await Promise.all(
      Object.keys(repositories).map(async (k) => {
        return { [k]: await new repositories[k](this[_dao]) }
      }),
    ).then((reps) =>
      reps.reduce((pre, item) => {
        return _.merge(pre, item)
      }, {}),
    )
  }

  parseMessageContent(msg) {
    const content = super.parseMessageContent(msg)
    const { workType } = content || {}
    if (workType) {
      return content
    } else {
      return null
    }
  }

  async doFeature(msg, channel, taskId) {
    const jobContent = this.parseMessageContent(msg)
    if (jobContent) {
      const { workType, input } = jobContent
      const workMan = assignWorker(workType)
      if (!workMan) {
        this.deadLineHandling(msg, new Error('Invalid message.'))
        await channel.reject(msg, false)
        return false
      }
      // const repository = await this.getRepository(workType)
      const result = await workMan.DoWork({ data: input, retry: msg.fields.redelivered }, taskId, this.repositories)
      // this.log.trace(result)
      if (result) {
        const { data, nextWorker } = result
        if (nextWorker) {
          const next = this.queueName
          this.log.debug({ next })
          if (next && data) {
            const sendDatas = _.isArray(data) ? data : [data]
            await Promise.all(sendDatas.map((item) => channel.sendToQueue(next, Buffer.from(JSON.stringify({ workType: nextWorker, input: item })), { persistent: true })))
            // if (repository && _.isFunction(workMan.SaveData)) {
            //   await workMan.SaveData(sendDatas, taskId, repository)
            // }
          }
        }
        await channel.ack(msg)
        return true
      } else {
        await channel.reject(msg, false)
        return false
      }
    } else {
      this.deadLineHandling(msg, new Error('Invalid message.'))
      await channel.reject(msg, false)
      return false
    }
  }
}

module.exports = VersatileWorkLine
