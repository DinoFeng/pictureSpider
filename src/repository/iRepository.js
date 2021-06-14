const _ = require('lodash')
const { log4js } = require('../util/logger')

const _log = Symbol('log')
const _dao = Symbol('dao')
const _genCondition = Symbol('_genCondition')
const _genSaveSQL = Symbol('_genSaveSQL')
const _alignFields = Symbol('_alignFields')
class BaseRepository {
  constructor(dao) {
    this[_log] = log4js.getLogger(this.tableName)
    return new Promise((resolve, reject) => {
      this[_dao] = dao
      return this.InitTable()
        .then(() => {
          this.log.trace(`table ${this.tableName} ready`)
          resolve(this)
        })
        .catch(err => reject(err))
    })
  }

  get log() {
    return this[_log]
  }

  get dao() {
    return this[_dao]
  }

  get tableName() {
    return ''
  }

  async InitTable() {
    return true
  }

  [_genSaveSQL](data) {
    return `INSERT OR REPLACE INTO ${this.tableName} (${[...Object.keys(data), 'updatedAt'].join(',')})
    VALUES (${[...('?'.repeat(Object.keys(data).length).split('')), "datetime('now')"].join(',')})`
  }

  [_alignFields](datas) {
    let base = {}
    let isAligned = true
    for (const data of datas) {
      base = _.merge(base, data)
      isAligned = (Object.keys(base).length === Object.keys(data).length)
    }
    if (!isAligned) {
      base = Object.keys(base).reduce((pre, cur) => {
        return _.merge(pre, { [cur]: '' })
      }, {})
      return datas.map(data => _.merge({}, base, data))
    } else {
      return datas
    }
  }

  async batchSave(datas) {
    const saveDatas = this[_alignFields](datas)

    const fields = Object.keys(saveDatas[0])
    fields.push('updatedAt')
    const selectValues = datas.map(data => {
      const fieldsSQL = Object.keys(data).map(k => `? AS ${k}`)
      fieldsSQL.push("datetime('now') AS updatedAt")
      return `SELECT ${fieldsSQL.join(', ')}`
    }).join('\n UNION ')
    const sql = `INSERT OR REPLACE INTO ${this.tableName} (${fields.join(',')}) 
    ${selectValues}
    `
    const values = saveDatas.map(data => Object.values(data))
    return this[_dao].run(sql, _.flattenDeep(values))
  }

  async save(data) {
    // const id = data.id
    // const updated = _.omit(data, ['id'])
    return this[_dao].run(this[_genSaveSQL](data), Object.values(data))
    // INSERT OR REPLACE INTO link (word1, word2, n)
    // SELECT
    //     x.word1, x.word2, x.n + COALESCE(l.n, 0)
    // FROM (SELECT '%s' AS word1, '%s' AS word2, %d AS n) x
    // LEFT JOIN link l ON x.word1 = l.word1 AND x.word2 = l.word2
  }

  async create(data) {
    return this[_dao].run(
      `INSERT INTO ${this.tableName} (${[...Object.keys(data), 'updatedAt'].join(',')})
      VALUES (${[...('?'.repeat(Object.keys(data).length).split('')), "datetime('now')"].join(',')})`,
      Object.values(data))
  }

  async update(id, updated) {
    const data = _.omit(updated, ['id']) // id不更新
    return this[_dao].run(
      `UPDATE ${this.tableName}
        ${Object.keys(data).map(k => `${k}=?`).join(',')}
        WHERE id=?`,
      [...Object.values(data), id])
  }

  async batchUpdate(ids, updated) {
    const data = _.omit(updated, ['id']) // id不更新
    const sql = `UPDATE ${this.tableName}
        SET updatedAt = datetime('now'),
        ${Object.keys(data).map(k => `${k}=?`).join(',')}
        WHERE id in (${ids.map(() => '?').join(',')})`
    return this[_dao].run(sql,
      [...Object.values(data), ...ids])
  }

  async delete(id) {
    return this[_dao].run(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id],
    )
  }

  async [_genCondition](condition) {
    const p = []
    const w = []
    Object.keys(condition).forEach(k => {
      Object.keys(condition[k]).forEach(o => {
        p.push(condition[k][o])
        w.push(`${k} ${o} ?`)
      })
    })
    return { w, p }
  }

  async find(condition, fields, limit) {
    const { w, p } = await this[_genCondition](condition)
    // logger.trace({ w, p })
    const sql = `SELECT ${_.isArray(fields) ? fields.join(',') : '*'} 
      FROM ${this.tableName} 
      ${w.length > 0 ? `WHERE ${w.join(' and ')}` : ''}
      ${limit ? `LIMIT ${limit}` : ''}
      `
    return this[_dao].all(sql, p)
  }

  async get(condition, fields) {
    const { w, p } = await this[_genCondition](condition)
    // logger.trace({ w, p })
    const sql = `SELECT ${_.isArray(fields) ? fields.join(',') : _.isString(fields) ? fields : '*'} 
      FROM ${this.tableName} 
      ${w.length > 0 ? `WHERE ${w.join(' and ')}` : ''}
      `
    // logger.trace(sql)
    return this[_dao].get(sql, p)
  }
}
module.exports = BaseRepository
