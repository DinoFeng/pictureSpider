const amqp = require('amqplib')
const { logger } = require('./util/logger')
const firstQ = {
  T1: 'VersatileWorkLine_man1',
  T2: 'PostEnterPageWorkLine',
  T3: 'VersatileWorksLine',
}
;(async () => {
  const argvs = process.argv.length > 2 ? process.argv.slice(2) : ['T1']
  const q = firstQ[argvs[0]] || firstQ.T1
  let conn = null
  try {
    conn = await amqp.connect('amqp://localhost', { clientProperties: { connection_name: 'bossMan' } })
    const channel = await conn.createChannel()
    await channel.assertQueue(q, { durable: true })
    await channel.sendToQueue(q, Buffer.from(JSON.stringify({ workType: 'PostEnterPageWorker', input: true })))
    logger.info('message sended!')
  } catch (e) {
    logger.error('trigger task error', e)
  } finally {
    setTimeout(() => {
      conn && conn.close()
      logger.info('connection closed.')
    }, 10000)
  }
})()
