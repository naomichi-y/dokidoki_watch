'use strict'

const express = require('express')
const app = express()
const router = express.Router()
const config = require('config')
const FitbitApiClient = require('fitbit-node')
const beautify = require('json-beautify')
const models = require('../lib/models')
const fitbit = require('../lib/fitbit')

router.get('/:username?', (req, res) => {
    if (req.params.username) {
        let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)

        models.User.find({where: {username: req.params.username}}).then(user => {
            if (user) {
                let endpoint = req.query.endpoint

                if (!endpoint) {
                    endpoint = fitbit.heartrateEndpoint(user.timezone)
                }

                fitbitApiClient.get(endpoint, user.access_token).then(results => {
                    if (results[1].statusCode !== 200) {
                        res.json(results[1])

                    } else {
                        res.render('api/index', {
                            data: beautify(results, null, 2),
                            endpoint: endpoint
                        })
                    }
                }).catch(err => {
                    res.json(err)
                })
            } else {
                res.json({message: 'User does not exist.' })
            }

        }).catch(err => {
            res.json(err)
        })

    } else {
        let baseUrl = `${req.protocol}://${req.header('host')}/`

        res.render('api/index', {
            baseUrl: baseUrl
        })
    }
})

module.exports = router
