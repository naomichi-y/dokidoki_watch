'use strict'

const awsServerlessExpress = require('aws-serverless-express')

exports.handler = (event, context) => {
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development'
    }

    let app = require('../app')
    let server = awsServerlessExpress.createServer(app)

    awsServerlessExpress.proxy(server, event, context)
}
