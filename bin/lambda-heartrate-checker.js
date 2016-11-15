'use strict'

let logger = require('../lib/logger')

exports.handler = (event, context, callback) => {
    logger.info('Processing started.')
    process.env.NODE_ENV = context.invokedFunctionArn ? 'production' : 'development'

    setTimeout(function() {
        let worker = require('../lib/tasks/heartrate_worker')

        worker.run().then(() => {
            logger.info('Processing was succesed.')
            callback(null, 'Check is completed.')
        }).catch (err => {
            logger.error('Processing was failed.')
            callback(JSON.stringify(err))
        })
    }, 1000)
}
