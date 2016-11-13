'use strict'

const express = require('express')
const app = express()
const router = express.Router()
const config = require('config')
const FitbitApiClient = require('fitbit-node')

router.get('/new', (req, res) => {
    let fitbit = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)
    let redirectUrl = fitbit.getAuthorizeUrl(config.fitbit.scope, config.fitbit.callback_url)

    res.redirect(redirectUrl)
})

module.exports = router;
