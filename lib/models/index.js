'use strict'

let fs = require('fs')
let path  = require('path')
let Sequelize = require('sequelize')
let basename = path.basename(module.filename)
let env = process.env.NODE_ENV || 'development'
let config = require(__dirname + '/../../config/database.json')[env]
let db = {}
let logger = require('../logger')
let sequelize = null

config.logging = logger.info

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable])
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config)
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
  })
  .forEach(file => {
    let model = sequelize['import'](path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
