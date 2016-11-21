'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const app = express()
const ect = require('ect')
const routes = require('./routes')

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(awsServerlessExpressMiddleware.eventContext())
app.engine('ect', ect({ watch: true, root: __dirname + '/views', ext: '.ect' }).render)
app.set('view engine', 'ect')
app.use(express.static(__dirname + '/public'))

app.use('/', routes.api)
app.use('/api', routes.api)
app.use('/users', routes.users)
app.use('/receiver', routes.receiver)

if (process.env.LAUNCH_MODE === 'listen') {
    app.listen(3000)
}

module.exports = app
