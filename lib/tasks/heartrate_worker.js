'use strict'

const Promise = require('bluebird')
const config = require('config')
const moment = require('moment-timezone');
const i18n = require('../i18n').configure()
const models = require('../models')
const line = require('../providers/line')
const fitbit = require('../fitbit')
const logger = require('../logger')

function heartrateSummary(user) {
    return new Promise((resolve, reject) => {
        fitbit.heartrateDataset(user).then(results => {
            let activitiesHeart = results['activities-heart'][0]
            let activitiesHeartIntraday = results['activities-heart-intraday']
            let dataset = activitiesHeartIntraday.dataset

            if (dataset.length) {
                let totalHeartrate = 0
                let bulk = []
                let previousDate = null
                let currentDate = null
                let hasChangedDay = false
                let lastActivityDate = user.last_activity_at ? moment.tz(user.last_activity_at, 'UTC') : null
                let average = 0

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

                        totalHeartrate += data.value

                    } else {
                        logger.info(`Time already registered: ${currentDate}`)
                    }

                    previousDate = moment.tz(`${activitiesHeart.dateTime} ${data.time}`, user.timezone).utc()
                })

                logger.info(`Registration target record was found. (${bulk.length} records)`)

                if (bulk.length) {
                    resolve([bulk, previousDate, Math.round(totalHeartrate / bulk.length)])
                } else {
                    resolve()
                }

            } else {
                logger.info('Registration target record was not found.')
                resolve()
            }

        }).catch(err => {
            reject(err)
        })
    })
}

function bulkSave(userId, dataset, lastActivityAt, average) {
    return new Promise((resolve, reject) => {
        models.HeartrateActivity.bulkCreate(dataset).then(() => {
            return models.User.update({
                last_activity_at: lastActivityAt
            }, {
                where: { id: userId }
            }).then(() => {
                resolve(average)
            }).catch(err => {
                reject(err)
            })

        }).catch(err => {
            reject(err)
        })
    })
}

function notification(average) {
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

        heartrateSummary(user).then(results => {
            if (results) {
                return bulkSave(user.id, results[0], results[1], results[2]).then(average => {
                    if (average) {
                        logger.info(`Average heart rate: ${average})`)

                        if (average > config.heartrate.threshold.upper_limit) {
                            notification(average).then(() => {
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
        return new Promise((resolve, reject) => {
            let promises = []

            logger.info('Search target users.')

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
