const Rabbit = require('../util/rabbit')
const { log4js } = require('../util/logger')

const parseInfo = (info) => {
  try {
    const r = JSON.parse(info)
    const { msgContent } = r || {}
    return msgContent
  } catch (e) {
    return null
  }
}

const getWarnInfo = (line, logger) => {
  // logger.trace(line)
  const reg = /^\[\S+\] \[\w+\] \w+ - (\{.+\})$/ig
  const matchs = reg.exec(line)
  // logger.trace(matchs)
  if (matchs) {
    const [, info] = matchs
    // logger.trace({ info })
    const msgContent = parseInfo(info)
    // logger.trace({ msgContent })
    return msgContent
  }
}

(async () => {
  const hostName = 'checkDownloadLog'
  const logger = log4js.getLogger(hostName)
  const errLog = log4js.getLogger(`${hostName}_err`)
  await new Rabbit({ address: 'amqp://localhost', hostName })
    .then(rabbit =>
      rabbit.connection.createChannel()
        .then(async channel => {
          const queueName = 'downloadImage'
          const readline = require('linebyline')
          const rl = readline('logs\\CheckImageWorker_error.log')
          rl.on('line', async function (line, lineCount, byteCount) {
            logger.trace({ lineCount })
            const msgContent = getWarnInfo(line, logger)
            if (msgContent) {
              await channel.sendToQueue(queueName, Buffer.from(msgContent), { persistent: true })
              logger.info(`${msgContent}.`)
            }
          }).on('error', function (e) {
            // something went wrong
            errLog.error(e)
            // reject(e)
          })
        }),
    )
})()
