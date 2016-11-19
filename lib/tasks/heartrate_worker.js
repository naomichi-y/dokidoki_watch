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
                let hasChangedDay = false
                let lastActivityDate = user.last_activity_at ? moment.tz(user.last_activity_at, 'UTC') : null
                let count = 0

                logger.info(`Record was found. (${dataset.length} records)`)

                dataset.forEach(data => {
                    currentDate = moment.tz(`${activitiesHeart.dateTime} ${data.time}`, user.timezone).utc()

                    if (previousDate !== null && currentDate.isBefore(previousDate) || hasChangedDay) {
                        currentDate.add(1, 'd')
                        hasChangedDay = true
                    }

                    if (lastActivityDate === null || currentDate.isAfter(lastActivityDate)) {
                        logger.info(`Add time: ${currentDate}`)

                        bulk.push({
                            user_id: user.id,
                            bpm: data.value,
                            activity_at: currentDate
                        })

                        sum += data.value
                        count++

                    } else {
                        logger.info(`Time already registered: ${currentDate}`)
                    }

                    previousDate = moment.tz(`${activitiesHeart.dateTime} ${data.time}`, user.timezone).utc()
                })

                average = Math.round(sum / count)

                models.HeartrateActivity.bulkCreate(bulk).then(() => {
                    return models.User.update({
                        last_activity_at: previousDate
                    }, {
                        where: { id: user.id }
                    }).then(() => {
                        resolve(average)
                    }).catch(err => {
                        reject(err)
                    })

                }).catch(err => {
                    reject(err)
                })

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
