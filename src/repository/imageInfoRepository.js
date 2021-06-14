const baseInterface = require('./iRepository')
const _createTable = Symbol('createTable')
const _createUniqueIndex = Symbol('createUniqueIndex')
const _createSourcePageIndex = Symbol('_createSourcePageIndex')
const _createFolderIndex = Symbol('_createFolderIndex')
class MqItemsRepository extends baseInterface {
  get tableName() {
    return 'ImageList'
  }

  async InitTable() {
    return this[_createTable]()
      .then(() => Promise.all([
        this[_createUniqueIndex](),
        this[_createSourcePageIndex](),
        this[_createFolderIndex](),
      ]))
      .then(() => true)
  }

  async [_createTable]() {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL UNIQUE,
        folder TEXT,
        referer TEXT,
        picUrl TEXT,
        sourcePage TEXT,
        action TEXT,
        updatedAt TEXT)`
    return this.dao.run(sql)
  }

  async [_createUniqueIndex]() {
    const sql = `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_${this.tableName}_unique ON ${this.tableName}(fullName)`
    return this.dao.run(sql)
  }

  async [_createSourcePageIndex]() {
    const sql = `
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_sourcePage ON ${this.tableName}(sourcePage)`
    return this.dao.run(sql)
  }

  async [_createFolderIndex]() {
    const sql = `
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_folder ON ${this.tableName}(folder)`
    return this.dao.run(sql)
  }
}
module.exports = MqItemsRepository
