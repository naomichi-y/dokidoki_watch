'use strict'

const Promise = require('bluebird')
const config = require('config')
const FitbitApiClient = require('fitbit-node')
const beautify = require('json-beautify')
const models = require('../lib/models')
const fitbitApiHelper = require('../lib/fitbit-api-helper')

let controller = {
    index: (req, res, next) => {
        if (req.params.username) {
            Promise.try(() => {
                models.User.find({where: {username: req.params.username}}).then(user => {
                    if (user) {
                        let endpoint = req.query.endpoint

                        if (!endpoint) {
                            endpoint = fitbitApiHelper.buildHeartrateEndpoint(user.timezone)
                        }

                        return [endpoint, user]

                    } else {
                        next(new Error('User does not exist.'))
                    }

                }).then(results => {
                    let endpoint = results[0]
                    let user = results[1]
                    let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)

                    fitbitApiClient.get(endpoint, user.access_token).then(results => {
                        if (results[1].statusCode === 200) {
                            return [endpoint, results]

                        } else {
                            let error = results[0].errors[0]
                            next(new Error(`${error.errorType} (${error.message})`))
                        }

                    }).then(results => {
                        res.render('api/index', {
                            data: beautify(results[1], null, 2),
                            endpoint: results[0]
                        })
                    }).catch(err => {
                        next(err)
                    })

                }).catch(err => {
                    next(err)
                })
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
