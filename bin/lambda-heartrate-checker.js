'use strict'

const logger = require('../lib/logger')
const worker = require('../lib/tasks/heartrate_worker')
const Promise = require('bluebird')

exports.handler = (event, context, callback) => {
    logger.info('Processing started.')

    Promise.onPossiblyUnhandledRejection(err => {
        if (err.stack) {
            callback(err.stack)
        } else {
            callback(err)
        }
    });

    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development'
    }

    worker.run().then(() => {
        callback(null, 'Check is completed.')
    })
}
