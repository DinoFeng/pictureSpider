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

const getUrl = (line, logger) => {
  // logger.trace(line)
  const reg = /^.+ (https:\/\/\S+\.html) .+$/ig
  const matchs = reg.exec(line)
  // logger.trace(matchs)
  if (matchs) {
    const [, content] = matchs
    return content
    // const page = getFirstPageUrl(url)
    // logger.trace({ url, page })
  }
}

(async () => {
  const hostName = 'checkParsePicPageWorkerLog'
  const logger = log4js.getLogger(hostName)
  const errLog = log4js.getLogger(`${hostName}_err`)
  await new Rabbit({ address: 'amqp://localhost', hostName })
    .then(rabbit =>
      rabbit.connection.createChannel()
        .then(async channel => {
          const queueName = 'versatileWorkLine'
          const readline = require('linebyline')
          const rl = readline('logs\\ParseTotalPicPageWorker_error.log')
          rl.on('line', async function (line, lineCount, byteCount) {
            // if (lineCount > 300) {
            // logger.trace({ lineCount, line })
            const url = getUrl(line, logger)
            logger.trace({ lineCount, url })
            if (url) {
              const data = {
                workType: 'ParseTotalPageWorker',
                input: { href: url },
              }
              await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true })
              logger.info(`${JSON.stringify(data)} sended.`)
            }
          }).on('error', function (e) {
            errLog.error(e)
          })
        }),
    )
})()
