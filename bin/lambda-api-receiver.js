'use strict'
const awsServerlessExpress = require('aws-serverless-express')

exports.handler = (event, context) => {
    process.env.NODE_ENV = event.stageVariables ? event.stageVariables.NODE_ENV : 'development'

    let app = require('../app')
    let server = awsServerlessExpress.createServer(app)

    awsServerlessExpress.proxy(server, event, context)
}
