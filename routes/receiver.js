'use strict'

const Promise = require('bluebird')
const express = require('express')
const router = require('express-promise-router')()
const config = require('config')
const FitbitApiClient = require('fitbit-node')
const models = require('../lib/models')

let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)

function getAccessToken(code) {
    return new Promise((resolve, reject) => {
        fitbitApiClient.getAccessToken(code, config.fitbit.callback_url).then(results => {
            resolve(results)
        }).catch(err => {
            reject(err)
        })
    })
}

function createUser(dataset) {
    return new Promise((resolve, reject) => {
        models.User.find({fitbit_id: dataset.user_id}).then(user => {
            if (user) {
                models.User.updateToken(user.id, dataset.access_token, dataset.refresh_token).then(() => {
                    throw new Error(`User is registered (user_id: ${user.fitbit_id})`)
                }).catch(err => {
                    reject(err)
                })
            } else {
                fitbitApiClient.get('/profile.json', dataset.access_token).then(profile => {
                    user = models.User.build({
                        username: dataset.user_id,
                        fitbit_id: dataset.user_id,
                        timezone: profile[0].user.timezone,
                        access_token: dataset.access_token,
                        refresh_token: dataset.refresh_token
                    })
                    .save()
                    .then(() => {
                        resolve(dataset)

                    }).catch(err => {
                        reject(err)
                    })

                }).catch(err => {
                    reject(err)
                })
            }

        }).catch(err => {
            reject(err)
        })
    })
}

router.get('/fitbit/callback', (req, res) => {
    return Promise.try(() => {
        return getAccessToken(req.query.code)
    }).then(results => {
        return createUser(results);
    }).then(results => {
        res.json(results)
    })
})

module.exports = router;
