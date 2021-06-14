const DAO = require('../repository/dao')
const AdoWorkLine = require('./iAdoWorkLine')
const _ = require('lodash')
const { repositories } = require('../repository/repositoryFactory')

const _dao = Symbol('_dao')
const _repositories = Symbol('_repositories')
class ParseCatalogPageWorkLine extends AdoWorkLine {
  get workerName() {
    return 'ParseCatalogPageWorker'
  }

  get dbFilePath() {
    return process.env.DB_FILE || './db/PicLib.db'
  }

  get ADO() {
    return this[_dao]
  }

  get repositories() {
    return this[_repositories]
  }

  async beforeConsume() {
    this[_dao] = await new DAO(this.dbFilePath)

    this[_repositories] = await Promise.all(
      Object.keys(repositories).map(async (k) => {
        return { [k]: await new repositories[k](this[_dao]) }
      }),
    ).then((reps) =>
      reps.reduce((pre, item) => {
        return _.merge(pre, item)
      }, {}),
    )
    // this[_repositories] = new repositories.CatalogInfoRepository(dao)
  }

  get maxRetries() {
    return 2
  }

  get exportExchange() {
    const name = 'exportCatalogPageInfo'
    return {
      name,
      type: '',
    }
  }

  get bindExchange() {
    const name = 'exportEnterPageInfo'
    return {
      name,
      type: '',
    }
  }
}

module.exports = ParseCatalogPageWorkLine
