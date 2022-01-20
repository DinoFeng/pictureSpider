const { logger } = require('./util/logger')
// const https = require('https')
const tools = require('./util/tools')

;(async () => {
  // logger.info(`Proxy is:${await tools.checkProxy()}`)
  const x = await tools.saveUrlToFile(
    'https://www.xiurenji.net/uploadfile/202001/11/00124046423.jpg',
    {
      // rejectUnauthorized: false,
      // headers: {
      //   referer: 'https://www.mm131.net/',
      // },
      proxy: true,
      // httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    },
    { folder: 'd:\\testing', fileName: 'test', extName: '.jpg', timeout: 3000 },
  )
  logger.debug({ x })
})()
