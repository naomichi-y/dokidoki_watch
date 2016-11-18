'use strict'

let logger = require('../lib/logger')

exports.handler = (event, context, callback) => {
    logger.info('Processing started.')
    process.env.NODE_ENV = context.invokedFunctionArn ? 'production' : 'development'

    let worker = require('../lib/tasks/heartrate_worker')

    worker.run().then(() => {
        callback(null, 'Check is completed.')
    }).catch (err => {
        callback(err)
    })
}
