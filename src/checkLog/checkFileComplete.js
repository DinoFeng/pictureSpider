const tools = require('../util/tools')
const Rabbit = require('../util/rabbit')
const { log4js } = require('../util/logger')
const fs = require('fs')
const path = require('path')

const checkFolderFile = async (folder, log) => {
  const items = fs.readdirSync(folder)
  const result = []
  for (const item of items) {
    const itemFullName = path.resolve(folder, item)
    // console.debug(itemFullName)
    const ele = fs.statSync(itemFullName)
    if (ele.isDirectory()) {
      const infos = await checkFolderFile(itemFullName, log)
      result.push(...infos)
    } else if (ele.isFile()) {
      let isComplete = false
      try {
        isComplete = await tools.imageFileIsComplete(itemFullName)
      } catch (e) {
        log.error(itemFullName, e)
      }
      if (!isComplete) {
        const info = await parseXsnvshenUrlInfo(itemFullName)
        result.push(info)
        // result.push(itemFullName)
      }
    }
  }
  return result
}

const parseXsnvshenUrlInfo = async fullName => {
  const reg = /F:\\xsnvshen\\album\\(\d+)\\(\d+).+\\(\d+).jpg/ig
  const match = reg.exec(fullName)
  if (match) {
    const [, catlog, folderNo, fileNo] = match
    const picUrl = `https://img.xsnvshen.com/album/${catlog}/${folderNo}/${fileNo}.jpg`
    const folder = path.dirname(fullName)
    const headers = {
      Referer: `https://www.xsnvshen.com/album/${folderNo}`,
    }
    return { picUrl, folder, headers }
    // console.debug({ catlog, folderNo, fileNo })
    // console.debug(`https://img.xsnvshen.com/album/${catlog}/${folderNo}/${fileNo}.jpg`)
    // console.debug(path.dirname(fullName))
    // console.debug(`https://www.xsnvshen.com/album/${folderNo}`)
  }
}
  ;
(async () => {
  const hostName = 'checkImageComplete'
  const logger = log4js.getLogger(hostName)
  // const infos = []
  // const paths = ['201501', '201505', '201511']
  // for (const path of paths) {
  //   try {
  //     const info = await checkFolderFile(`F:\\xgmn\\uploadfile\\${path}`, logger)
  //     infos.push(...info)
  //   } catch (e) {
  //     logger.error(`${path} `, e)
  //   }
  // }
  const path = 'F:\\xsnvshen\\album\\24936' // 'F:\\xgmn\\uploadfile\\202001'
  const infos = await checkFolderFile(path, logger)

  if (infos.length > 0) {
    // logger.warn(JSON.stringify(infos))
    await new Rabbit({ address: 'amqp://localhost', hostName })
      .then(rabbit =>
        rabbit.connection.createChannel()
          .then(async channel => {
            const queueName = 'downloadImage'
            infos.forEach(info => {
              const msgContent = JSON.stringify(info)
              if (msgContent) {
                await channel.sendToQueue(queueName, Buffer.from(msgContent), {persistent: true})
                logger.warn(`${msgContent}.`)
              }
            })
            logger.info('All is\'t complete file sended.')
          }),
      )
  } else {
    logger.info('all file complete')
  }
})()
