const _ = require('lodash')
const BaseWorkman = require('./iWorkman')
const { getParser } = require('../webParser/parserFactory')
const baseTimeout = 30 * 1000

class ParseCatalogPageWorker extends BaseWorkman {
  // constructor(workerName) {
  // }

  async fitlerSendedPage(page, repository) {
    const { href } = page
    const hasSended = await repository.get({
      href: { '=': href },
    })
    if (!hasSended) {
      return page
    } else {
      return null
    }
  }

  async DoWork(input, taskId, repositories) {
    this.log.debug(`input is ${JSON.stringify(input)}`)
    const { data: url, retry } = input || {}
    if (url) {
      const timeout = retry ? 2 * baseTimeout : baseTimeout
      const parser = getParser(url, this.log)
      const { is404, pages } = await parser.getCatalogPages(url, timeout)
      if (!is404) {
        if (pages && pages.length > 0) {
          let willSend = []
          const repository = _.get(repositories, ['CatalogInfoRepository'])
          if (repository) {
            willSend = await Promise.all(pages.map(page => {
              // this.log.info(page)
              return this.fitlerSendedPage(page, repository)
            }))
            willSend = willSend.filter(v => v)
          } else {
            willSend = pages
          }
          if (willSend.length > 0) {
            const data = willSend.map(page => _.merge({}, page, { sourcePage: url }))
            if (repository) {
              await this.SaveData(data, taskId, repository)
            }
            return { data, nextWorker: 'ParseTotalPicPageWorker' }
          } else {
            this.log.error(`${taskId} Process done. ${url} not any page can be sended.`)
          }
        } else {
          this.log.error(`${taskId} Process done. ${url}  is't 404, but no any image info.`)
        }
      } else {
        this.log.warn(`${taskId} Process done. ${url} is 404. no any pic catalog info`)
      }
    } else {
      this.log.fatal(`${taskId} Process done. Input data ${JSON.stringify(input)} is invalid.`)
      return null
    }
  }

  async SaveData(data, taskId, repository) {
    if (repository) {
      if (_.isArray(data)) {
        repository.batchSave(data)
      } else {
        repository.save(data)
      }
    }
  }
}

module.exports = ParseCatalogPageWorker
