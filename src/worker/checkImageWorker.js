const _ = require('lodash')
const path = require('path')
const BaseWorkman = require('./iWorkman')
const tools = require('../util/tools')

class CheckImageWorker extends BaseWorkman {
  // constructor(workerName) {
  // }

  async DoWork(input, taskId, repositories) {
    this.log.debug(`input is ${JSON.stringify(input)}`)
    const { data: dataInfo } = input || {}
    const { picUrl, folder, fileName, extName, checked } = dataInfo || {}
    if (folder && (picUrl || fileName)) {
      const imageFile = tools.genFileFullName(picUrl, { folder, fileName, extName })
      let isComplete = false
      try {
        isComplete = await tools.imageFileIsComplete(imageFile)
      } catch (e) {
        this.log.error(`Occur error when checking ${imageFile}.`, e)
      }
      if (!isComplete) {
        if (checked && checked > 3) {
          this.log.mark(`${taskId} Process done. ${JSON.stringify(input)} . This file has exceeded the number of checks.`)
          return null
        } else {
          const data = _.merge({}, dataInfo, { checked: checked ? checked + 1 : 1 })
          this.log.warn(`${imageFile} is't complete. checked:${data.checked}`)
          return { data, nextWorker: 'DownloadImageWorker' }
        }
      } else {
        const repository = _.get(repositories, ['ImageInfoRepository'])
        if (repository) {
          const { data: { fileName, folder, picUrl, headers: { Referer }, sourcePage } } = input || {}
          const fullName = `${folder}\\${fileName}${path.extname(picUrl)}`
          await repository.save({ fullName, folder, referer: Referer, picUrl, sourcePage })
        }
        return { data: null }
      }
    } else {
      this.log.fatal(`${taskId} Process done. Input data ${JSON.stringify(input)} is invalid.`)
      return null
    }
  }
}

module.exports = CheckImageWorker
