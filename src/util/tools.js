const fs = require('fs')
const path = require('path')
const axios = require('axios')
// const axios = require('axios-https-proxy-fix')
const https = require('https')
// const HttpsProxyAgent = require('https-proxy-agent')
const _ = require('lodash')
const iconv = require('iconv-lite')
const jd = require('jsdom')
const jq = require('jquery')
const uuidV1 = require('uuid').v1

const { logger } = require('./logger')
const A_MOMENT = 3000 // 3秒
// const PROXY = {
//   host: '127.0.0.1',
//   port: '7777',
// }

const parseExtName = (extName) => {
  const reg = /^(\.\w+).*$/gi
  const matchs = reg.exec(extName)
  if (matchs) {
    const [, res] = matchs
    // console.trace(matchs)
    return res
  }
}

const tools = {
  genUUID() {
    return uuidV1().replace(/-/g, '').toUpperCase()
  },

  padLeft(str, total, pad) {
    return `${Array(total).join(pad || '0')}${str}`.slice(-total)
  },

  async waitAmoment(t) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, t || A_MOMENT)
    })
  },

  async checkProxy() {
    // const agent1 = new HttpsProxyAgent(PROXY)
    const agent2 = new https.Agent({ rejectUnauthorized: false })
    // const agent = agent1 && agent2 ? _.merge({}, agent1, agent2) : agent1 || agent2
    const agent = agent2
    const request = {
      headers: {
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
      },
      httpsAgent: agent,
      url: 'http://www.baidu.com',
    }
    try {
      const response = await axios(request)
      const { status } = response
      // logger.debug({ status, headers })
      return status < 400
    } catch (e) {
      logger.error('checkProxy', e)
      return false
    }
  },

  async accessUrl(url, requestOptions, l) {
    const log = l || logger
    const { proxy } = requestOptions || {}
    // const agent1 = proxy ? new HttpsProxyAgent(PROXY) : undefined
    const agent2 = proxy ? new https.Agent({ rejectUnauthorized: false }) : undefined
    // const agent = agent1 && agent2 ? _.merge({}, agent1, agent2) : agent1 || agent2
    const agent = agent2
    const request = _.merge(
      {
        timeout: A_MOMENT,
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
        },
      },
      _.omit(requestOptions || {}, ['proxy']),
      { httpsAgent: agent },
      {
        url,
        responseType: 'stream',
      },
    )
    log.trace('accessUrl', { request })
    log.info('accessUrl', JSON.stringify({ request }))
    let error = null
    const response = await axios(request).catch((err) => {
      const { response, name, message, stack, config } = err
      error = { name, message, stack }
      log.trace({ name, message, stack, config })
      if (response) {
        // const { data, status, headers } = response
        // console.trace({ data, status, headers })
        return response
        // const { error } = data
        // if (error) {
        //   throw error
        // }
      }
      // // logger.trace({ name, message, stack, config, request })
      // // logger.error(err)
      throw err
    })
    // const { status, headers } = response
    // log.trace({ status, headers, error })
    return { response, error }
  },

  async streamToFile(stream, options, l) {
    const log = l || logger
    const { folder: pFolder, fileName, extName: pExtName, timeout, showPercentage } = options || {}
    if (!fileName) throw new Error('Request fileName!')
    const extName = pExtName || '.html'
    const folder = path.resolve(pFolder || __dirname)
    const fullFileName = path.resolve(folder, `${fileName}${extName}`)
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true })
    }
    log.trace('streamToFile', { fullFileName, fileName, extName, folder })
    const writer = fs.createWriteStream(fullFileName)
    let receivedBytes = 0
    let timeoutid = null
    // stream.resume()
    stream.pipe(writer)
    // https://github.com/axios/axios/issues/2810
    return await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        receivedBytes += chunk.length
        // received
        const show = showPercentage ? `${Math.ceil((receivedBytes / showPercentage) * 1000) / 10}%` : receivedBytes
        log.trace(`streamToFile: stream loading:${show}`)
        if (timeout) {
          timeoutid && clearTimeout(timeoutid)
          timeoutid = setTimeout(() => reject(new Error(`reveived timeout:${timeout}ms`)), timeout)
        }
      })
      stream.on('end', () => {
        timeoutid && clearTimeout(timeoutid)
        log.trace('streamToFile: stream end')
      })
      writer.on('finish', () => {
        log.trace('streamToFile: writer finish')
        resolve(fullFileName)
      })
      writer.on('error', reject)
    })
  },

  async streamToContent(stream, encoding) {
    // stream.resume()
    return await new Promise((resolve, reject) => {
      const chunks = []
      stream.on('data', (chunk) => {
        chunks.push(chunk)
      })
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks)
        if (encoding && encoding.toLowerCase() === 'buffer') {
          resolve(buffer)
        } else {
          resolve(iconv.decode(buffer, encoding || 'utf8'))
        }
      })
      stream.on('error', reject)
    })
  },

  async saveUrlToFile(url, requestOptions, options, l) {
    const { response } = await this.accessUrl(url, requestOptions)
    const { data: stream, headers } = response
    const totalLength = headers['content-length']
    return await this.streamToFile(
      stream,
      _.merge(
        {
          showPercentage: totalLength,
          fileName: this.trimEndStr(path.basename(url), path.extname(url)),
          extName: parseExtName(path.extname(url)),
        },
        options,
      ),
      l,
    )
  },

  genFileFullName(url, options) {
    const f = this.trimEndStr(path.basename(url), path.extname(url))
    const e = parseExtName(path.extname(url))
    const opt = _.merge({ fileName: f, extName: e }, options)

    const { folder: pFolder, fileName, extName: pExtName } = opt || {}
    const extName = pExtName || '.html'
    const folder = path.resolve(pFolder || __dirname)
    const fullFileName = path.resolve(folder, `${fileName}${extName}`)
    return fullFileName
  },

  async readUrlToContent(url, requestOptions, encoding) {
    const { response, error } = await this.accessUrl(url, requestOptions)
    const { data: stream, status } = response
    if (status === 200 || status === 404) {
      return {
        is404: status === 404,
        content: await this.streamToContent(stream, encoding),
      }
    } else {
      throw error
    }
  },

  async readFile(filePath, encoding) {
    return await new Promise((resolve, reject) => {
      fs.readFile(filePath, null, (err, data) => {
        if (err) {
          reject(err)
        } else {
          if (encoding) {
            if (encoding.toLowerCase() !== 'buffer') {
              // const buff = new Buffer(data, 'binary')
              // const buff = Buffer.from(data, 'binary')
              resolve(iconv.decode(data, encoding))
            } else {
              resolve(data)
            }
          } else {
            resolve(iconv.decode(data, 'utf8'))
          }
        }
      })
    })
  },

  async getElements(html, selector) {
    // selector ref: https://www.w3schools.com/jquery/jquery_ref_selectors.asp
    const w = new jd.JSDOM().window
    const $ = jq(w)
    return $(html).find(selector)
  },
  async getElementAttribute(element, attr) {
    // logger.trace({ attr })
    const w = new jd.JSDOM().window
    const $ = jq(w)
    if (_.isArray(attr)) {
      const res = await Promise.all(attr.map((att) => this.getElementAttribute(element, att)))
      return res.reduce((pre, cur) => _.merge(pre, cur), {})
    } else {
      return { [attr]: $(element).attr(attr) }
    }
  },
  async getElementText(element) {
    const w = new jd.JSDOM().window
    const $ = jq(w)
    return $(element).text()
  },

  checkBufferType(buffer) {
    return (
      (buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71 && buffer[4] === 13 && buffer[5] === 10 && buffer[6] === 26 && buffer[7] === 10 && 'png') ||
      (buffer[0] === 66 && buffer[1] === 77 && 'bmp') ||
      (buffer[0] === 71 && buffer[1] === 73 && buffer[2] === 70 && buffer[3] === 56 && 'gif') ||
      // JPG 文件头
      // Start Marker  | JFIF Marker | Header Length | Identifier
      // 0xff, 0xd8    | 0xff, 0xe0  |    2-bytes    | "JFIF\0"
      (buffer[0] === 0xff && buffer[1] === 0xd8 && 'jpg') ||
      'unknowed'
    )
  },

  imageIsComplete: {
    png: (buffer) => {
      // && buffer[buffer.length - 8] === 73 && buffer[buffer.length - 7] === 69 && buffer[buffer.length - 6] === 78
      if (buffer[buffer.length - 5] === 68 && buffer[buffer.length - 4] === 174 && buffer[buffer.length - 3] === 66 && buffer[buffer.length - 2] === 96 && buffer[buffer.length - 1] === 130) {
        return true
      }
      // 有些情况最后多了些没用的字节
      for (let i = buffer.length - 1; i > buffer.length / 2; --i) {
        if (buffer[i - 5] === 68 && buffer[i - 4] === 174 && buffer[i - 3] === 66 && buffer[i - 2] === 96 && buffer[i - 1] === 130) {
          return true
        }
      }
    },
    // bmp: buffer => {
    //   // // 整数转成字符串拼接
    //   // const str = Convert.ToString(buffer[5], 16) + Convert.ToString(buffer[4], 16)
    //   //   + Convert.ToString(buffer[3], 16) + Convert.ToString(buffer[2], 16)
    //   // const iLength = Convert.ToInt32("0x" + str, 16) // 16进制数转成整数
    //   // if (iLength <= buffer.length) // 有些图比实际要长
    //   //   return true
    // },
    gif: (buffer) => {
      // 标准gif 检查00 3B
      if (buffer[buffer.length - 2] === 0 && buffer[buffer.length - 1] === 59) {
        return true
      }
      // 检查含00 3B
      for (let i = buffer.length - 1; i > buffer.length / 2; --i) {
        if (buffer[i] !== 0) {
          if (buffer[i] === 59 && buffer[i - 1] === 0) {
            return true
          }
        }
      }
    },
    jpg: (buffer) => {
      // 标准jpeg以ffd9作为结束标记
      if (buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9) {
        return true
      } else {
        // 有好多jpg最后被人为补了些字符也能打得开, 算作完整jpg, ffd9出现在近末端
        // jpeg开始几个是特殊字节, 所以最后大于10就行了 从最后字符遍历
        // 有些文件会出现两个ffd9 后半部分ffd9才行
        for (let i = buffer.length - 2; i > buffer.length / 2; --i) {
          // 检查有没有ffd9连在一起的
          if (buffer[i] === 0xff && buffer[i + 1] === 0xd9) {
            return true
          }
        }
      }
    },
  },

  async imageFileIsComplete(file, l) {
    // const log = l || logger
    // https://blog.csdn.net/osmeteor/article/details/40299357
    return await new Promise((resolve, reject) => {
      fs.readFile(file, null, (err, data) => {
        if (err) {
          reject(err)
        } else {
          const type = this.checkBufferType(data)
          // log.trace(type)
          if (!this.imageIsComplete[type]) {
            reject(new Error(`${file} type is ${type}. now we can't handle this type.`))
          } else {
            const r = this.imageIsComplete[type](data)
            resolve(!!r)
          }
        }
      })
    })
  },

  trimEndStr(v, s) {
    const reg = RegExp(`^(.*)${s}$`, 'i')
    return _.replace(v, reg, '$1')
  },
}

module.exports = tools
