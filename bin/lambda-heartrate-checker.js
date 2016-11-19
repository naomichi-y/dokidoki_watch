'use strict'

let logger = require('../lib/logger')

exports.handler = (event, context, callback) => {
    logger.info('Processing started.')

    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development'
    }

    let worker = require('../lib/tasks/heartrate_worker')

    worker.run().then(() => {
        callback(null, 'Check is completed.')
    }).catch (err => {
        callback(JSON.stringify(err, null, '  '))
    })
}
