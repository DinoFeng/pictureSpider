const _ = require('lodash')
const path = require('path')
const URL = require('url').URL
const tools = require('../util/tools')
const baseInterface = require('./iWebParser')
// https://www.xiurenji.com/  // score:9

const parseUrlKindAndId = (url, log) => {
  const reg = /https:\/\/\w+\.\w+\.\w+\/(\w+)\/([A-Za-z]*|[A-Za-z]+_)(\d+)(|_\d*)\.html/gi
  const matchs = reg.exec(url)
  // log && log.trace(matchs)
  if (matchs) {
    const [, kind, , cat, page] = matchs
    return { kind, cat, page }
  }
}

class XRJi extends baseInterface {
  get curHost() {
    return 'www.xiurenji.net' // 'www.xiurenji.vip'
  }

  get outputFolder() {
    return 'E:\\xiurenji'
  }

  // get encoding() {
  //   return 'GB2312'
  // }

  get parseImageSelector() {
    // return '.img p>img'
    return '.content p>img[src]'
  }

  get catalogSelector() {
    // return '.tp2 .dan a:has(img)'
    return 'ul.update_area_lists li.i_list a:has(img)'
  }

  get entryPageConfig() {
    return {
      hostUrl: `https://${this.curHost}`, //  'https://www.xiurenji.cc',
      defaultPatten: 'index',
      catalogs: {
        // page_${page}
        XiuRen: { maxPage: 5 }, // Done
        MFStar: { maxPage: 5 }, // Done
        MiStar: { maxPage: 5 }, // Done
        MyGirl: { maxPage: 5 }, // Done
        IMiss: { maxPage: 5 }, // Done
        YouWu: { maxPage: 5 }, // Done
        FeiLin: { maxPage: 5 }, // Done
        MiiTao: { maxPage: 5 }, // Done
        YouMi: { maxPage: 5 }, // Done
        XiaoYu: { maxPage: 5 }, // Done
        HuaYang: { maxPage: 5 }, // Done
        XingYan: { maxPage: 5 }, // Done
        BoLoli: { maxPage: 5 }, // Done
        Uxing: { maxPage: 5 }, // Done
        WingS: { maxPage: 5 }, // Done
        LeYuan: { maxPage: 5 }, // Done
        Taste: { maxPage: 5 }, // Done
        HuaYan: { maxPage: 5 }, // Done
        DKGirl: { maxPage: 5 }, // Done
        Candy: { maxPage: 5 }, // Done
        MintYe: { maxPage: 5 }, // Done
        MTMeng: { maxPage: 5 }, // Done
        Micat: { maxPage: 5 }, // Done
      },
    }
  }

  async parsePicPageUrl(content) {
    // const log = this[_log]
    const numberSelector = '.page>a[href]'
    const spans = await tools.getElements(content, numberSelector)
    const result = new Set()
    await Promise.all(
      spans.map(async (index, span) => {
        // const [text, { href }] = await Promise.all([
        //   tools.getElementText(span),
        //   tools.getElementAttribute(span, ['href']),
        // ])
        // const number = _.toNumber(text)
        // // log.trace(number, _.isNumber(number))
        // return _.isNumber(number) && !_.isNaN(number) ? href : null
        const { href } = await tools.getElementAttribute(span, 'href')
        result.add(href)
      }),
    )
    // .then(res => _.max(res))
    return Array.from(result) // new Set(res.filter(v => v)))
    // return Array.from(new Set(res.filter(v => v)))
  }

  async is404(content) {
    const selector = '.common strong>a'
    const eles = await tools.getElements(content, selector)
    if (eles && eles.length > 0) {
      const r = await Promise.all(
        eles.map((index, ele) =>
          tools.getElementText(ele).then((res) => {
            // this.log.trace(ele)
            // this.log.trace({ 'a.text': res })
            return res.includes('错') ? 1 : 0
          }),
        ),
      ).then((res) => _.max(res))
      return r > 0
    } else {
      return false
    }
  }

  async getPicUrlFromPicPage(url, timeout) {
    const { content } = await this.getPicPageContent(url, timeout)
    const { kind, cat, page } = parseUrlKindAndId(url, this.log)
    const id = _.trimStart(cat, kind)
    this.log.debug({ kind, cat, page })
    const [is404, images] = await Promise.all([
      this.is404(content),
      this.parsePicUrl(content).then((imgs) =>
        imgs.map(({ src, alt }, index) => {
          if (src) {
            const folder = this.outputFolder
            const fullId = id.length > 4 ? tools.padLeft(id, 5) : tools.padLeft(id, 4)
            return {
              picUrl: new URL(src, url).href,
              // folder: path.join(folder, path.dirname(src), alt),
              folder: path.join(folder, fullId.substr(0, fullId.length - 2), id),
              fileName: `${_.trim(alt.replace(/([\\/:*?<>|"]+)/gi, ' '))}${page}_${index}`,
              headers: { Referer: url },
            }
          } else {
            return null
          }
        }),
      ),
    ])
    return { is404, images: images.filter((v) => v) }
  }

  async getTotalPicPageUrl(url, timeout) {
    const { content } = await this.getPicPageContent(url, timeout)
    const [is404, pages] = await Promise.all([this.is404(content), this.parsePicPageUrl(content).then((res) => res.map((r) => new URL(r, url).href))])
    return { is404, pages }
  }

  // async getCatalogPages(url, timeout) {
  //   const { content } = await this.getPicPageContent(url, timeout)
  //   const { is404, pages } = await super.getCatalogPages(url, timeout)
  //   return {
  //     is404: this.is404(content),
  //     pages: pages.map(({ href, title }) => ({ href: new URL(href, url).href, title })),
  //   }
  // }
  async getCatalogPages(url, timeout) {
    const { content } = await this.getPicPageContent(url, timeout)
    const [is404, pages] = await Promise.all([
      this.is404(content),
      this.parseCatalogPage(content).then((pages) =>
        pages.map(({ href, title }) => {
          const urlObject = new URL(href, url)
          const host = urlObject.host
          const { kind, cat: pageId } = parseUrlKindAndId(urlObject.href)
          return { href: urlObject.href, title, host, kind, pageId }
        }),
      ),
    ])
    return { is404, pages }
  }
}

module.exports = XRJi
