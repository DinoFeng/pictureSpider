const _ = require('lodash')
const path = require('path')
const tools = require('../util/tools')
const { log4js } = require('../util/logger')

const _log = Symbol('_log')
class BaseWebParser {
  constructor() {
    // if (!log) throw new Error('logger is request.')
    this[_log] = log4js.getLogger(this.parserName)
  }

  get parserName() {
    return this.constructor.name
  }

  get log() {
    return this[_log]
  }
  // static get historyHosts() {
  //   return ['']
  // }

  get curHost() {
    return ''
  }

  get entryPageConfig() {
    return {
      hostUrl: `https://${this.curHost}`,
      defaultPatten: 'page_',
      catalogs: {
        catalogName: { maxPage: 1, patten: 'list_6_' }, // `${patten}${page}`
      },
    }
  }

  get encoding() {
    return ''
  }

  get parseImageSelector() {
    return 'img'
  }

  get catalogSelector() {
    return 'a'
  }

  get catalogTitleSelector() {
    return { selector: null, attr: null }
  }

  get outputFolder() {
    return __dirname
  }

  get requestOptions() {
    return {
      headers: {},
    }
  }

  getEntryCatalogPages() {
    const { catalogs, hostUrl, defaultPatten } = this.entryPageConfig
    const urls = Object.keys(catalogs).map((key) => {
      const { minPage, patten, maxPage } = catalogs[key] || {}
      const urlList = []
      for (let i = minPage || 1; i <= maxPage; i++) {
        const url = `${hostUrl}/${key}${i > 1 ? `/${defaultPatten || patten}${i}.html` : ''}`
        urlList.push(url)
      }
      return urlList
    })
    return _.flattenDeep(urls)
  }

  async getPicPageContent(url, timeout) {
    const encoding = this.encoding
    const requetOptions = _.merge({}, this.requestOptions, { timeout })
    return await tools.readUrlToContent(url, requetOptions, encoding)
  }

  async parsePicUrl(content) {
    const imgSelector = this.parseImageSelector
    const imgs = await tools.getElements(content, imgSelector)
    return await Promise.all(
      imgs.map(async (index, img) => {
        return await tools.getElementAttribute(img, ['src', 'alt'])
      }),
    )
  }

  async getPicUrlFromPicPage(url, timeout) {
    // return { is404, images }
    const outputFolder = this.outputFolder
    const { is404, content } = await this.getPicPageContent(url, timeout)
    // this.log.info(content)
    const imgs = is404 ? [] : await this.parsePicUrl(content)
    return {
      is404,
      images: await Promise.all(
        imgs.map(({ src, alt }) => {
          if (src) {
            return {
              src,
              alt,
              picUrl: src,
              folder: outputFolder,
              headers: { Referer: url },
            }
          } else {
            return null
          }
        }),
      ).then((res) => res.filter((v) => v)),
    }
  }

  async parseTotalNumber(content) {
    return 0
  }

  async parsePicPageUrl(url, content) {
    const pages = [url]
    const total = await this.parseTotalNumber(content)
    this.log && this.log.trace({ total })
    const extName = path.extname(url)
    const baseName = tools.trimEndStr(url, extName)
    for (let i = 1; i <= total; i++) {
      pages.push(`${baseName}_${i}${extName}`)
    }
    return pages
  }

  async getTotalPicPageUrl(url, timeout) {
    // return { is404, pages }
    const { is404, content } = await this.getPicPageContent(url, timeout)
    const pages = is404 ? [] : await this.parsePicPageUrl(url, content)
    return { is404, pages }
  }

  async parseCatalogPage(content) {
    const catalogSelector = this.catalogSelector
    const hrefElements = await tools.getElements(content, catalogSelector)
    return await Promise.all(
      hrefElements.map(async (index, aElement) => {
        const { href } = (await tools.getElementAttribute(aElement, 'href')) || {}
        const title = await this.parseCatalogTitle(aElement)
        return { href, title }
      }),
    )
  }

  async parseCatalogTitle(hrefElement) {
    const { selector, attr } = this.catalogTitleSelector || {}
    // this.log.trace({ selector, attr })
    if (selector) {
      const titleElements = await tools.getElements(hrefElement, selector)
      // this.log.trace({ titleElements })
      if (titleElements && titleElements.length > 0) {
        return titleElements.map(async (index, titleEle) => {
          // this.log.trace({ titleEle })
          const { [attr]: title } = (await tools.getElementAttribute(titleEle, attr || 'title')) || {}
          // this.log.trace({ title })
          return title
        })[0]
      }
    } else {
      const { title } = (await tools.getElementAttribute(hrefElement, attr || 'title')) || {}
      return title
    }
  }

  async getCatalogPages(url, timeout) {
    // return { is404, pages }
    const { is404, content } = await this.getPicPageContent(url, timeout)
    // this.log.trace(content)
    const pages = is404 ? [] : await this.parseCatalogPage(content)
    return { is404, pages }
  }
}

module.exports = BaseWebParser
