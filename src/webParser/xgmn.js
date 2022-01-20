const _ = require('lodash')
const path = require('path')
const URL = require('url').URL
const tools = require('../util/tools')
const baseInterface = require('./iWebParser')
// https://www.xgmn.org/  // score:9

const parseUrlKindAndId = (url, log) => {
  const reg = /https:\/\/\w+\.\w+\.\w+\/(\w+)\/([A-Za-z0-9]+)(|_\d*)\.html/ig
  const matchs = reg.exec(url)
  // log && log.trace(matchs)
  if (matchs) {
    const [, kind, cat, page] = matchs
    return { kind, cat, page }
  }
}

class XGMN extends baseInterface {
  get curHost() {
    return 'www.jpxgmn.net' // 'www.jpxgmn.top' // https://www.jpxgmn.top/ www.jpxgmn.cc
  }

  get outputFolder() {
    return 'E:\\xgmn'
  }

  // get encoding() {
  //   return 'GB2312'
  // }

  get parseImageSelector() {
    // return '.img p>img'
    // return '.img img'
    // return '.content p>img' //
    // return '.content img'
    return '.article-content img'
  }

  get catalogSelector() {
    return '.content a:has(img)'
  }

  // get proxy() {
  //   return {
  //     host: '127.0.0.1',
  //     port: '7777',
  //   }
  // }

  get requestOptions() {
    return {
      // proxy: this.proxy,
      headers: {
        Host: this.curHost, // 'www.jpxgmn.com',
        Connection: 'keep-alive',
        Accept: '*/*',
        // 'Accept-Encoding': 'gzip, deflate, br',
      },
    }
  }

  // get catalogTitleSelector() {
  //   return { selector: 'a', attr: 'title' }
  // }

  get entryPageConfig() {
    return {
      // hostUrl: 'https://www.mn5.cc',
      hostUrl: `https://${this.curHost}`, // 'https://www.jpxgmn.com',
      defaultPatten: 'page_',
      catalogs: {
        Xiuren: { maxPage: 5 },
        MyGirl: { maxPage: 5 }, // Done
        YouWu: { maxPage: 5 }, // Done
        IMiss: { maxPage: 5 }, // Done
        MiiTao: { maxPage: 5 }, // Done
        Uxing: { maxPage: 5 }, // Done
        FeiLin: { maxPage: 5 }, // Done
        MiStar: { maxPage: 5 }, // Done
        Tukmo: { maxPage: 5 }, // Done
        WingS: { maxPage: 5 }, // Done
        LeYuan: { maxPage: 5 }, // Done
        Taste: { maxPage: 5 }, // Done
        MFStar: { maxPage: 5 }, // Done
        Huayan: { maxPage: 5 }, // Done
        DKGirl: { maxPage: 5 }, // Done
        Candy: { maxPage: 5 }, // Done
        YouMi: { maxPage: 5 }, // Done
        MintYe: { maxPage: 5 }, // Done
        Micat: { maxPage: 5 }, // Done
        Mtmeng: { maxPage: 5 }, // Done
        HuaYang: { maxPage: 5 }, // Done
        XingYan: { maxPage: 5 }, // Done
        XiaoYu: { maxPage: 5 }, // Done
        Xgyw: { maxPage: 5 }, // Done
        Tuigirl: { maxPage: 5 }, // Done
        Ugirls: { maxPage: 5 }, // Done
        Tgod: { maxPage: 5 }, // Done
        TouTiao: { maxPage: 5 }, // Done
        Girlt: { maxPage: 5 }, // Done
        Aiyouwu: { maxPage: 5 }, // Done
        LEGBABY: { maxPage: 5 }, // Done
        Mtcos: { maxPage: 5 }, // Done
        MissLeg: { maxPage: 5 }, // Done
        BoLoli: { maxPage: 5 }, // Done
        Slady: { maxPage: 5 }, // Done
        YouMei: { maxPage: 2 }, // Done
        Siwameitui: { maxPage: 5 },
        Neiyiyouwu: { maxPage: 5 },
        Rihanmeinv: { maxPage: 5 },
      },
    }
  }

  async parsePicPageUrl(content) {
    // const log = this[_log]
    const numberSelector = '.pagination a'
    const spans = await tools.getElements(content, numberSelector)
    const result = new Set()
    await Promise.all(
      spans.map(async (index, span) => {
        // const [text, { href }] = await Promise.all([
        //   tools.getElementText(span),
        //   tools.getElementAttribute(span, ['href']),
        // ])
        // const number = _.toNumber(text)
        // log.trace(number, _.isNumber(number))
        // return _.isNumber(number) && !_.isNaN(number) ? href : null
        const { href } = await tools.getElementAttribute(span, 'href')
        result.add(href)
        // return href
      }),
    )
    // .then(res => _.max(res))
    return Array.from(result)// new Set(res.filter(v => v)))
  }

  async is404(content) {
    const selector = '.common strong>a'
    const eles = await tools.getElements(content, selector)
    if (eles && eles.length > 0) {
      const r = await Promise.all(eles.map((index, ele) =>
        tools.getElementText(ele)
          .then(res => {
            // this.log.trace(ele)
            // this.log.trace({ 'a.text': res })
            return res.includes('错') ? 1 : 0
          }),
      )).then(res => _.max(res))
      return r > 0
    } else {
      return false
    }
  }

  async parsePicUrl(content) {
    const imgs = await super.parsePicUrl(content)
    const titleEles = await tools.getElements(content, '.article-title')
    const title = await tools.getElementText(titleEles[0])

    this.log.debug(imgs)
    return await Promise.all(imgs.map(async ({ src, alt }) => {
      if (!alt) {
        if (titleEles && titleEles.length > 0) {
          return { src, alt: title }
        } else {
          return { src, alt: '' }
        }
      } else {
        return { src, alt }
      }
    }))
  }

  async getPicUrlFromPicPage(url, timeout) {
    const { content } = await this.getPicPageContent(url, timeout)
    const { kind, cat, page } = parseUrlKindAndId(url, this.log)
    const id = _.trimStart(cat, kind)

    // this.log.info({ kind, cat, page, id })
    const [is404, images] = await Promise.all([
      this.is404(content),
      this.parsePicUrl(content)
        .then(imgs => imgs.map(({ src, alt }, index) => {
          if (src) {
            const folder = this.outputFolder
            const fullid = tools.padLeft(id, 5)
            return {
              picUrl: new URL(src, url).href,
              // folder: path.join(folder, path.dirname(src), alt),
              folder: path.join(folder, fullid.substr(0, 3), id),
              fileName: `${_.trim(alt.replace(/([\\/:*?<>|"]+)/gi, ' '))}${page}_${index}`,
              headers: {
                Referer: url,
                Connection: 'keep-alive',
              },
              // proxy: this.proxy,
            }
          } else {
            return null
          }
        })),
    ])
    return { is404, images: images.filter(v => v) }
  }

  async getTotalPicPageUrl(url, timeout) {
    const { content } = await this.getPicPageContent(url, timeout)
    this.log && this.log.trace('getPicPageContent Done')
    const [is404, pages] = await Promise.all([
      this.is404(content),
      this.parsePicPageUrl(content)
        .then(res => res.map(r => new URL(r, url).href)),
    ])
    return { is404, pages }
  }

  async getCatalogPages(url, timeout) {
    // const { is404, pages } = await super.getCatalogPages(url, timeout)
    // return {
    //   is404,
    //   pages: pages.map(({ href, title }) => {
    //     const urlObject = new URL(href, url)
    //     const host = urlObject.host
    //     const { kind, cat } = parseUrlKindAndId(urlObject.href)
    //     return { href: urlObject.href, title, host, kind, pageId: _.trimStart(cat, kind) }
    //   }),
    // }
    const { content } = await this.getPicPageContent(url, timeout)
    const [is404, pages] = await Promise.all([
      this.is404(content),
      this.parseCatalogPage(content)
        .then(pages => pages.map(({ href, title }) => {
          const urlObject = new URL(href, url)
          const host = urlObject.host
          const { kind, cat: pageId } = parseUrlKindAndId(urlObject.href)
          return { href: urlObject.href, title, host, kind, pageId }
        })),
    ])
    return { is404, pages }
  }
}

module.exports = XGMN
