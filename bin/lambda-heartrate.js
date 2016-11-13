'use strict'

exports.handler = (event, context, callback) => {
    console.log('Processing started.')
    process.env.NODE_ENV = context.invokedFunctionArn ? 'production' : 'development'

    let worker = require('../lib/tasks/heartrate_worker')

    worker.run().then(() => {
        console.log('Processing was succesed.')
        callback(null, 'Check is completed.')
    }).catch (err => {
        console.log('Processing was failed.')
        callback(JSON.stringify(err))
    })
}
