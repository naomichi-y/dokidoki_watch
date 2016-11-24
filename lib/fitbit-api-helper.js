'use strict'

const Promise = require('bluebird')
const config = require('config')
const moment = require('moment-timezone')
const FitbitApiClient = require('fitbit-node')
const logger = require('./logger')
const models = require('./models')

let fitbitApiClient = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)

function parseGetResponse(endpoint, user) {
    return new Promise((resolve, reject) => {
        fitbitApiClient.get(endpoint, user.access_token).then(results => {
            if (results[0].errors) {
                reject(new Error(results[0].errors[0]))
            } else {
                resolve(results[0])
            }

        }).catch(err => {
            reject(err)
        })
    })
}

function parseApiError(err, endpoint, user) {
    return new Promise((resolve, reject) => {
        if (err.errorType === 'expired_token') {
            logger.info(`Access token has expired. (${user.access_token})`)

            fitbitApiClient.refreshAccesstoken(user.access_token, user.refresh_token).then(newToken => {
                return newToken

            }).then(newToken => {
                models.User.updateToken(user.id, newToken.access_token, newToken.refresh_token).then(() => {
                    logger.info(`Access token was updated. (${newToken.refresh_token})`)
                    logger.info(`Request API again: ${endpoint}`)

                }).then(() => {
                    fitbitApiClient.get(endpoint, newToken.access_token).then(results => {
                        resolve(results[0])

                    }).catch(err => {
                        reject(err)
                    })

                }).catch(err => {
                    reject(err)
                })

            }).catch(err => {
                reject(err)
            })

        } else {
            reject(new Error(`Error getting heart rate. (${err.errorType})`))
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
        return new Promise((resolve, reject) => {
            let endpoint = fitbitApiHelper.buildHeartrateEndpoint(user.timezone)

            logger.info(`Request endpoint: ${endpoint}`)

            parseGetResponse(endpoint, user).then(results => {
                resolve(results)

            }).catch(err => {
                parseApiError(err, endpoint, user).then(results => {
                    resolve(results)
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }
}

module.exports = fitbitApiHelper
