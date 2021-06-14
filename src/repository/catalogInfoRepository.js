const baseInterface = require('./iRepository')
const _createTable = Symbol('createTable')
const _createUniqueIndex = Symbol('createUniqueIndex')
const _createHostIndex = Symbol('_createHostIndex')
const _createKindIndex = Symbol('_createKindIndex')
const _createPageIdIndex = Symbol('_createPageIdIndex')
const _createSourcePageIndex = Symbol('_createSourcePageIndex')
class MqItemsRepository extends baseInterface {
  get tableName() {
    return 'CatalogInfo'
  }

  async InitTable() {
    return this[_createTable]()
      .then(() => Promise.all([
        this[_createUniqueIndex](),
        this[_createHostIndex](),
        this[_createKindIndex](),
        this[_createPageIdIndex](),
      ]))
      .then(() => true)
  }

  async [_createTable]() {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        href TEXT NOT NULL UNIQUE,
        title TEXT,
        host TEXT,
        kind TEXT,
        pageId TEXT,
        sourcePage TEXT,
        picCount INTEGER,
        extInfo TEXT,
        action TEXT,
        updatedAt TEXT)`
    return this.dao.run(sql)
  }

  async [_createUniqueIndex]() {
    const sql = `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_${this.tableName}_href ON ${this.tableName}(href)`
    return this.dao.run(sql)
  }

  async [_createKindIndex]() {
    const sql = `
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_kind ON ${this.tableName}(kind)`
    return this.dao.run(sql)
  }

  async [_createPageIdIndex]() {
    const sql = `
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_pageId ON ${this.tableName}(pageId)`
    return this.dao.run(sql)
  }

  async [_createHostIndex]() {
    const sql = `
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_host ON ${this.tableName}(host)`
    return this.dao.run(sql)
  }

  async [_createSourcePageIndex]() {
    const sql = `
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_sourcePage ON ${this.tableName}(sourcePage)`
    return this.dao.run(sql)
  }
}
module.exports = MqItemsRepository
