'use strict'

const config = require('config')
const i18n = require('../i18n').configure()
const models = require('../models')
const line = require('../providers/line')
const fitbitHelper = require('../fitbit-helper')
const moment = require('moment-timezone');
const logger = require('../logger')

function findHeartrateDataset(user) {
    return new Promise((resolve, reject) => {
        fitbitHelper.heartrateDataset(user).then(results => {
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
                resolve(average)

            } else {
                resolve()
            }

        }).catch(err => {
            reject(err)
        })
    })
}

function pushNotification(average) {
    return new Promise((resolve, reject) => {
        let message = i18n.__('messages.thresholdOver', config.heartrate.threshold.upper_limit, average)

        line.pushMessage(message).then(() => {
            resolve()
        }).catch(err => {
            reject(err)
        })
    })
}

function check(user) {
    return new Promise((resolve, reject) => {
        logger.info(`Check user id: ${user.id}`)

        findHeartrateDataset(user).then(average => {
            if (average) {
                logger.info(`Average heart rate: ${average} BPM)`)

                if (average > config.heartrate.threshold.upper_limit) {
                    pushNotification(average).then(() => {
                        resolve()
                    }).catch(err => {
                        reject(err)
                    })

                } else {
                    resolve()
                }
            } else {
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
