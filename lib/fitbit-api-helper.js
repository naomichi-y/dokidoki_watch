'use strict'

const Promise = require('bluebird')
const config = require('config')
const moment = require('moment-timezone')
const FitbitApiClient = require('fitbit-node')
const logger = require('./logger')
const models = require('./models')

let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)

function parseGetResponse(endpoint, user) {
    return Promise.try(() => {
        return fitbitApiClient.get(endpoint, user.access_token)
    })
    .then(results => {
        if (results[0].errors) {
            throw results[0].errors[0]
        } else {
            return results[0]
        }
    })
}

function parseApiError(err, endpoint, user) {
    return Promise.try(() => {
        if (err.errorType === 'expired_token') {
            let newToken

            logger.info('Access token has expired. (%s)', user.access_token)

            return fitbitApiClient.refreshAccesstoken(user.access_token, user.refresh_token)
                .then(newToken => {
                    return newToken

                })
                .then(results => {
                    newToken = results
                    logger.info('Access token was updated. (%s)', results.refresh_token)

                    return models.User.updateToken(user.id, results.access_token, results.refresh_token)

                })
                .then(results => {
                    logger.info('Request API again: %s', endpoint)

                    return fitbitApiClient.get(endpoint, newToken.access_token)

                })
                .then(results => {
                    return results[0]
                })

        } else {
            new Error(`Error getting heart rate. (${err.errorType})`)
        }
    })
}

let fitbitApiHelper = {
    buildHeartrateEndpoint: timezone => {
        let date = moment().tz(timezone)

        let startOffset = config.heartrate.monitor.minutes_range + config.heartrate.monitor.minutes_ago - 1
        let startDate = date.clone().subtract(startOffset, 'm')
        let periodStartDate = startDate.format('YYYY-MM-DD')
        let periodStartTime = startDate.format('HH:mm')

        let endOffset = config.heartrate.monitor.minutes_ago
        let endDate = date.clone().subtract(endOffset, 'm')
        let periodEndDate = endDate.format('YYYY-MM-DD')
        let periodEndTime = endDate.format('HH:mm')

        let endpoint = `/activities/heart/date/${periodStartDate}/${periodEndDate}/time/${periodStartTime}/${periodEndTime}.json`

        return endpoint
    },
    getHeartrateDataset: user => {
        let endpoint = fitbitApiHelper.buildHeartrateEndpoint(user.timezone)

        return Promise.try(() => {
            logger.info('Request endpoint: %s', endpoint)

            return parseGetResponse(endpoint, user)
        })
        .catch(err => {
            return parseApiError(err, endpoint, user)
                .then(results => {
                    return results
                })
        })
    }
}

module.exports = fitbitApiHelper
