'use strict'

const config = require('config')
const FitbitApiClient = require('fitbit-node')
const i18n = require('../i18n').configure()
const models = require('../models')
const line = require('../providers/line')
const fitbitHelper = require('../fitbit-helper')
const moment = require('moment-timezone');
const logger = require('../logger')

let getHeartrateDataset = user => {
    return new Promise((resolve, reject) => {
        let fitbit = new FitbitApiClient(config.fitbit.client_id, config.fitbit.client_secret)
        let endpoint = fitbitHelper.heartrateEndpoint(user.timezone)

        logger.info(`Check user id: ${user.id}`)
        logger.info(`Request endpoint: ${endpoint}`)

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

let check = (user) => {
    return new Promise(function(resolve, reject) {
        getHeartrateDataset(user).then(results => {
            let activitiesHeart = results['activities-heart'][0]
            let activitiesHeartIntraday = results['activities-heart-intraday']
            let dataset = activitiesHeartIntraday.dataset

            if (dataset.length) {
                let sum = 0
                let average = 0
                let bulk = []
                let previousDate = null
                let currentDate = null
                let isNextDay = false

                logger.info(`Record was found. (${dataset.length} records)`)

                dataset.forEach(data => {
                    sum += data.value
                    currentDate = moment.tz(`${activitiesHeart.dateTime} ${data.time}`, user.timezone).utc()

                    if (previousDate !== null && currentDate.isBefore(previousDate) || isNextDay) {
                        currentDate.add(1, 'd')
                        isNextDay = true
                    }

                    bulk.push({
                        user_id: user.id,
                        bpm: data.value,
                        activity_at: currentDate
                    })

                    previousDate = moment.tz(`${activitiesHeart.dateTime} ${data.time}`, user.timezone).utc()
                })

                average = Math.round(sum / dataset.length)

                models.HeartrateActivity.bulkCreate(bulk).then(() => {
                    return models.User.update({
                        last_activity_at: previousDate
                    }, {
                        where: { id: user.id }
                    }).then(() => {
                        if (average > config.heartrate.threshold.upper_limit) {
                            logger.info(`Heart rate threshold exceeded. (Average: ${average}BPM)`)

                            let message = i18n.__('messages.thresholdOver', config.heartrate.threshold.upper_limit, average)

                            line.pushMessage(message).then(() => {
                                resolve()
                            }).catch(err => {
                                reject(err)
                            })
                        } else {
                            resolve()
                        }

                    }).catch(err => {
                        reject(err)
                    })

                }).catch(err => {
                    reject(err)
                })
            } else {
                logger.info('Record was not found.')
                resolve()
            }
        }).catch(err => {
            reject(err)
        })
    })
}

module.exports = {
    run: () => {
        let promises = []

        return new Promise((resolve, reject) => {
            logger.info('Find target users.')

            models.User.findAll().then(users => {
                users.forEach(user => {
                    promises.push(check(user))
                })

                Promise.all(promises).then(() => {
                    resolve()

                }).catch(err => {
                    reject(err)
                })

            }).catch(err => {
                reject(err)
            })
        })
    }
}
