'use strict'

const Promise = require('bluebird')
const router = require('express-promise-router')()
const config = require('config')
const FitbitApiClient = require('fitbit-node')
const beautify = require('json-beautify')
const models = require('../lib/models')
const fitbit = require('../lib/fitbit')

let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)

function findUser(username) {
    return new Promise((resolve, reject) => {
        models.User.find({where: {username: username}}).then(user => {
            resolve(user)
        }).catch(err => {
            reject(err)
        })
    })
}

function findData(endpoint, user) {
    return new Promise((resolve, reject) => {
        fitbitApiClient.get(endpoint, user.access_token).then(results => {
            if (results[1].statusCode === 200) {
                resolve([endpoint, results])

            } else {
                let error = results[0].errors[0]
                reject(new Error(`${error.errorType} (${error.message})`))
            }
        })
   })
}

router.get('/:username?', (req, res) => {
    if (req.params.username) {
        return Promise.try(() => {
                return findUser(req.params.username)

        }).then((user) => {
            let endpoint = req.query.endpoint

            if (!endpoint) {
                endpoint = fitbit.heartrateEndpoint(user.timezone)
            }

            if (user) {
                return findData(endpoint, user)
            } else {
                throw new Error('User does not exist.')
            }

        }).then(results => {
            res.render('api/index', {
                data: beautify(results[1], null, 2),
                endpoint: results[0]
            })
        })

    } else {
        let baseUrl = `${req.protocol}://${req.header('host')}/`

        res.render('api/index', {
            baseUrl: baseUrl
        })
    }
})

module.exports = router
