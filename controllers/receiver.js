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
        return Promise.try(() => {
            fitbitApiClient.getAccessToken(req.query.code, config.fitbit.callback_url).then(results => {
                return results

            }).then(results => {
                models.User.find({fitbit_id: results.user_id}).then(user => {
                    if (user) {
                        models.User.updateToken(user.id, results.access_token, results.refresh_token).then(() => {
                            next(new Error(`User is registered (user_id: ${user.fitbit_id})`))
                        }).catch(err => {
                            next(err)
                        })

                    } else {
                        fitbitApiClient.get('/profile.json', results.access_token).then(profile => {
                            user = models.User.build({
                                username: results.user_id,
                                fitbit_id: results.user_id,
                                timezone: profile[0].user.timezone,
                                access_token: results.access_token,
                                refresh_token: results.refresh_token
                            })
                            .save()
                            .then(results => {
                                res.json(results)

                            }).catch(err => {
                                next(err)
                            })

                        }).catch(err => {
                            next(err)
                        })
                    }

                }).catch(err => {
                    next(err)
                })

            }).catch(err => {
                next(err)
            })
        })
    }
}

module.exports = controller
