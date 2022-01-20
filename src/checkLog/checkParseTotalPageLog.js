const Rabbit = require('../util/rabbit')
const { log4js } = require('../util/logger')

// const getFirstPageUrl = (url) => {
//   const reg = /https:\/\/www.xgmn.org\/Xiuren\/Xiuren(\d+)_\d+.html/ig
//   const matchs = reg.exec(url)
//   if (matchs) {
//     const [, pageNumber] = matchs
//     return `https://www.xgmn.org/Xiuren/Xiuren${pageNumber}.html`
//   }
// }

const getWarnUrl = (line, logger) => {
  // logger.trace(line)
  const reg = /^\[\S+\] \[ERROR\] \w+ - (.+)$/ig
  const matchs = reg.exec(line)
  // logger.trace(matchs)
  if (matchs) {
    const [, content] = matchs
    try {
      const { msgContent } = JSON.parse(content)
      return msgContent
    } catch (e) {
      logger.error(content, e)
      throw e
    }
    // const page = getFirstPageUrl(url)
    // logger.trace({ url, page })
  }
}

(async () => {
  const hostName = 'checkParseTotalPageLog'
  const logger = log4js.getLogger(hostName)
  const errLog = log4js.getLogger(`${hostName}_err`)
  await new Rabbit({ address: 'amqp://localhost', hostName })
    .then(rabbit =>
      rabbit.connection.createChannel()
        .then(async channel => {
          const queueName = 'parseTotalPage'
          const readline = require('linebyline')
          const rl = readline('logs\\parseTotalPage_worker_dead.log')
          rl.on('line', async function (line, lineCount, byteCount) {
            // if (lineCount > 300) {
            logger.trace({ lineCount })
            const url = getWarnUrl(line, logger)
            if (url) {
              await channel.sendToQueue(queueName, Buffer.from(url), { persistent: true })
              logger.info(`${url} sended.`)
            }
          }).on('error', function (e) {
            errLog.error(e)
          })
        }),
    )
})()
