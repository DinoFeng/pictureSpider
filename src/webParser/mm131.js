const _ = require('lodash')
const path = require('path')
const tools = require('../util/tools')
const URL = require('url').URL
const baseInterface = require('./iWebParser')
// https://www.mm131.net/  // score:8

const parseUrlKindAndId = (url, log) => {
  const reg = /https:\/\/www\.mm131\.net\/(\S+)\/(\d+)(|_\d*)\.html/ig
  const matchs = reg.exec(url)
  // log && log.trace(matchs)
  if (matchs) {
    const [, kind, id] = matchs
    return { kind, id }
  }
}

class MM131 extends baseInterface {
  // static get historyHosts() {
  //   return ['www.mm131.net']
  // }

  get curHost() {
    return 'www.xxxxx.net' // 网址
  }

  get outputFolder() {
    return 'E:\\mm'
  }

  get encoding() {
    return 'GB2312'
  }

  get parseImageSelector() {
    return '.content-pic img'
  }

  get catalogSelector() {
    return '.list-left dd>a:has(img)'
  }

  get catalogTitleSelector() {
    return { selector: '>img', attr: 'alt' }
  }

  get entryPageConfig() {
    return {
      hostUrl: `https://${this.curHost}`, // 'https://www.mm131.net',
      // defaultPatten: 'page_',
      catalogs: {
        xinggan: { maxPage: 6, patten: 'list_6_' }, // list_6_${page} 225
        qingchun: { maxPage: 3, patten: 'list_1_' }, // list_1_${page} 34
        xiaohua: { maxPage: 1, patten: 'list_2_' }, // list_2_${page} 8
        chemo: { maxPage: 1, patten: 'list_3_' }, // list_3_${page} 12
        qipao: { maxPage: 1, patten: 'list_4_' }, // list_4_${page} 5
        mingxing: { maxPage: 1, patten: 'list_5_' }, // list_5_${page} 10
      },
    }
  }

  async parseTotalNumber(content) {
    const pageNumberSelector = '.content-page>span'
    const spans = await tools.getElements(content, pageNumberSelector)
    if (spans && spans.length > 0) {
      const res = await Promise.all(
        spans.map((index, span) =>
          tools.getElementText(span).then((text) => {
            const reg = /共(\d+?)页/gi
            const matchs = reg.exec(text)
            if (matchs) {
              const [, total] = matchs
              return _.toNumber(total)
            } else {
              return null
            }
          }),
        ),
      )
      const result = res.filter((v) => v).sort((a, b) => b - a)
      return result[0]
    }
    return 0
  }

  async getPicUrlFromPicPage(url, timeout) {
    const { is404, images } = await super.getPicUrlFromPicPage(url, timeout)
    const { kind, id } = parseUrlKindAndId(url, this.log) || {}
    this.log.trace({ kind, id })
    return {
      is404,
      images: images.map(({ src, alt, picUrl, folder, headers }, index) => {
        return {
          picUrl,
          folder: path.join(folder, tools.padLeft(id, 4).substr(0, 2), id),
          fileName: `${_.trim(alt.replace(/([\\/:*?<>|"]+)/gi, ' '))}${tools.trimEndStr(path.basename(src), path.extname(src))}_${index}`,
          headers,
        }
      }),
    }
  }

  async getCatalogPages(url, timeout) {
    const { is404, pages } = await super.getCatalogPages(url, timeout)
    return {
      is404,
      pages: pages.map(({ href, title }) => {
        const urlObject = new URL(href)
        const host = urlObject.host
        const { kind, id: pageId } = parseUrlKindAndId(href)
        return { href, title, host, kind, pageId }
      }),
    }
  }
}

module.exports = MM131
