'use strict'

const Promise = require('bluebird')
const express = require('express')
const router = require('express-promise-router')()
const config = require('config')
const FitbitApiClient = require('fitbit-node')
const models = require('../lib/models')

let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)
let controller = {
    callback: (req, res, next) => {
        let fitbitProfile

        Promise.try(() => {
            return fitbitApiClient.getAccessToken(req.query.code, config.fitbit.callback_url)
        })
        .then(results => {
            fitbitProfile = results

            return models.User.find({fitbit_id: fitbitProfile.user_id})
        })
        .then(results => {
            if (results) {
                models.User.updateToken(results.id, results.access_token, results.refresh_token)
                .then(() => {
                    throw new Error(`User is registered (user_id: ${results.fitbit_id}`)
                }).catch(err => {
                    next(err)
                })

            } else {
                fitbitApiClient.get('/profile.json', fitbitProfile.access_token)
                .then(results => {
                    return results
                })
                .then(results => {
                    return models.User.build({
                        username: fitbitProfile.user_id,
                        fitbit_id: fitbitProfile.user_id,
                        timezone: results[0].user.timezone,
                        access_token: fitbitProfile.access_token,
                        refresh_token: fitbitProfile.refresh_token
                    })
                    .save()
                })
                .then(results => {
                    res.json(results)
                })
                .catch(err => {
                    next(err)
                })
            }
        })
        .catch(err => {
            next(err)
        })
    }
}

module.exports = controller
