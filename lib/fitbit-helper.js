'use strict'

const config = require('config')
const _ = require('lodash');
const moment = require('moment-timezone')
const FitbitApiClient = require('fitbit-node')
const logger = require('./logger')
const models = require('./models')

let fitbit = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)

function get(endpoint, user) {
    return new Promise((resolve, reject) => {
        fitbit.get(endpoint, user.access_token).then(results => {
            let result = results[0]

            if (result.errors) {
                result.errors.forEach(error => {
                    if (error.errorType === 'expired_token') {
                        logger.info(`Access token has expired. (${user.access_token})`)

                        fitbit.refreshAccesstoken(user.access_token, user.refresh_token).then(new_token => {
                            models.User.updateToken(user.id, new_token.access_token, new_token.refresh_token).then(() => {
                                logger.info(`Access token was updated. (${new_token.refresh_token})`)

                                fitbit.get(endpoint, new_token.access_token).then(results => {
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
                        reject(`An error occurred in obtaining heart rate. (${error.errorType})`)
                    }
                })
            } else {
                resolve(result)
            }
        }).catch(err => {
            reject(err)
        })
    })
}

let fitbitHelper = {
    heartrateEndpoint: timezone => {
        let date = moment().tz(timezone)

        let beginOffset = config.heartrate.monitoring.minutes_range + config.heartrate.monitoring.minutes_ago - 1
        let beginDate = date.clone().subtract(beginOffset, 'm')
        let targetBeginDate = beginDate.format('YYYY-MM-DD')
        let targetBeginTime = beginDate.format('HH:mm')

        let endOffset = config.heartrate.monitoring.minutes_ago
        let endDate = date.clone().subtract(endOffset, 'm')
        let targetEndDate = endDate.format('YYYY-MM-DD')
        let targetEndTime = endDate.format('HH:mm')

        let endpoint = `/activities/heart/date/${targetBeginDate}/${targetEndDate}/time/${targetBeginTime}/${targetEndTime}.json`

        return endpoint
    },
    heartrateDataset: user => {
        return new Promise((resolve, reject) => {
            let endpoint = fitbitHelper.heartrateEndpoint(user.timezone)

            logger.info(`Check user id: ${user.id}`)
            logger.info(`Request endpoint: ${endpoint}`)

            get(endpoint, user).then(results => {
                resolve(results)
            }).catch(err => {
                reject(err)
            })
        })
    }
}

module.exports = fitbitHelper
