'use strict'

const express = require('express')
const nofavicon = require("express-no-favicons")
const bodyParser = require('body-parser')
const cors = require('cors')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const app = express()
const ect = require('ect')
const routes = require('./routes')
const i18n = require('./lib/i18n').configure()

app.use(nofavicon())
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(awsServerlessExpressMiddleware.eventContext())
app.engine('ect', ect({ watch: true, root: __dirname + '/views', ext: '.ect' }).render)
app.set('view engine', 'ect')
app.use(i18n.init)

app.use('/', routes.api)
app.use('/api', routes.api)
app.use('/users', routes.users)
app.use('/receiver', routes.receiver)

if (process.env.LAUNCH_MODE === 'listen') {
    app.listen(3000)
}

module.exports = app
