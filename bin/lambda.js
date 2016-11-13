'use strict'
const awsServerlessExpress = require('aws-serverless-express')

exports.handler = (event, context) => {
    let stageVariables = event.stageVariables
    process.env.NODE_ENV = stageVariables ? stageVariables.NODE_ENV : 'development'

    let app = require('../app')
    let server = awsServerlessExpress.createServer(app)

    awsServerlessExpress.proxy(server, event, context)
}
