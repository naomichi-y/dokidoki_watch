'use strict'

const Promise = require('bluebird')
const express = require('express')
const router = require('express-promise-router')()
const config = require('config')
const FitbitApiClient = require('fitbit-node')

router.get('/new', (req, res) => {
    let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)
    let redirectUrl = fitbitApiClient.getAuthorizeUrl(config.fitbit.scope, config.fitbit.callback_url)

    res.redirect(redirectUrl)
})

module.exports = router;
