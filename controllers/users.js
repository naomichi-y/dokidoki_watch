'use strict'

const Promise = require('bluebird')
const config = require('config')
const FitbitApiClient = require('fitbit-node')

let controller = {
    new: (req, res, next) => {
        let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)
        let redirectUrl = fitbitApiClient.getAuthorizeUrl(config.fitbit.scope, config.fitbit.callback_url)

        res.redirect(redirectUrl)
    }
}

module.exports = controller
