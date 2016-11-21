'use strict'

const express = require('express')
const app = express()
const router = express.Router()
const config = require('config')
const FitbitApiClient = require('fitbit-node')
const models = require('../lib/models')

router.get('/fitbit/callback', (req, res) => {
    let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)

    fitbitApiClient.getAccessToken(req.query.code, config.fitbit.callback_url).then(result => {
        models.User.find({fitbit_id: result.user_id}).then(user => {
            if (user) {
                models.User.updateToken(user.id, result.access_token, result.refresh_token).then(() => {
                    res.json({message: `User is registered (user_id: ${user.fitbit_id})` })
                }).catch(err => {
                    res.json(err)
                })
            } else {
                fitbitApiClient.get('/profile.json', result.access_token).then(profile => {
                    user = models.User.build({
                        username: result.user_id,
                        fitbit_id: result.user_id,
                        timezone: profile[0].user.timezone,
                        access_token: result.access_token,
                        refresh_token: result.refresh_token
                    })
                    .save()
                    .then(() => {
                        res.json(result)

                    }).catch(err => {
                        res.json(err)
                    })

                }).catch(err => {
                    res.json(err)
                })
            }

        }).catch(err => {
            res.json(err)
        })

    }).catch(err => {
        res.json(err)
    })
})

module.exports = router;
