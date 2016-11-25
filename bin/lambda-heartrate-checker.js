'use strict'

const Promise = require('bluebird')
const logger = require('../lib/logger')
const worker = require('../lib/tasks/heartrate_worker')

exports.handler = (event, context, callback) => {
    logger.info('Processing started.')

    Promise.onPossiblyUnhandledRejection(err => {
        callback(err.stack)
    });

    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development'
    }

    worker.run()
        .then(() => {
            callback(null, 'Check is completed.')
        })
}
