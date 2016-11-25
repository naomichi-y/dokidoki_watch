'use strict'

const Promise = require('bluebird')
const config = require('config')
const FitbitApiClient = require('fitbit-node')
const beautify = require('json-beautify')
const models = require('../lib/models')
const fitbitApiHelper = require('../lib/fitbit-api-helper')

let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)
let controller = {
    index: (req, res, next) => {
        if (req.params.username) {
            let endpoint = req.query.endpoint

            Promise.try(() => {
                return models.User.find({where: {username: req.params.username}})
            })
            .then(results => {
                if (results) {
                    if (!endpoint) {
                        endpoint = fitbitApiHelper.buildHeartrateEndpoint(results.timezone)
                    }

                    return results

                } else {
                    throw new Error('User does not exist.')
                }

            })
            .then(results => {
                return fitbitApiClient.get(endpoint, results.access_token)
            })
            .then(results => {
                if (results[1].statusCode === 200) {
                    return results

                } else {
                    throw new Error(`${results[1].statusMessage}`)
                }

            })
            .then(results => {
                res.render('api/index', {
                    data: beautify(results[1], null, 2),
                    endpoint: endpoint
                })
            })
            .catch(err => {
                next(err)
            })

        } else {
            let baseUrl = `${req.protocol}://${req.header('host')}/`

            res.render('api/index', {
                baseUrl: baseUrl,
            })
        }
    }
}

module.exports = controller
