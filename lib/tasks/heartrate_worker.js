'use strict'

const Promise = require('bluebird')
const config = require('config')
const moment = require('moment-timezone');
const i18n = require('../i18n').configure()
const models = require('../models')
const line = require('../providers/line')
const fitbitApiHelper = require('../fitbit-api-helper')
const logger = require('../logger')

function getHeartrateSummary(user) {
    return Promise.try(() => {
        return fitbitApiHelper.getHeartrateDataset(user)
    })
    .then(results => {
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

            logger.info('Record was found. (%s records)', dataset.length)

            dataset.forEach(data => {
                currentDate = moment.tz(`${activitiesHeart.dateTime} ${data.time}`, user.timezone).utc()

                if (previousDate !== null && currentDate.isBefore(previousDate) || hasChangedDay) {
                    currentDate.add(1, 'd')
                    hasChangedDay = true
                }

                if (lastActivityDate === null || currentDate.isAfter(lastActivityDate)) {
                    logger.info('Add time: %s', currentDate)

                    bulk.push({
                        user_id: user.id,
                        bpm: data.value,
                        activity_at: currentDate
                    })

                    totalHeartrate += data.value

                } else {
                    logger.info('Time already registered: %s', currentDate)
                }

                previousDate = moment.tz(`${activitiesHeart.dateTime} ${data.time}`, user.timezone).utc()
            })

            logger.info('Registration target record was found. (%s records)', bulk.length)

            if (bulk.length) {
                return [bulk, previousDate, Math.round(totalHeartrate / bulk.length)]
            }

        } else {
            logger.info('Registration target record was not found.')
        }
    })
}

function check(user) {
    return Promise.try(() => {
        logger.info('Check user id: %s', user.id)

        return getHeartrateSummary(user)
    })
    .then(results => {
        if (results) {
            return models.HeartrateActivity.bulkCreate(results[0])
                .then(results => {
                    return models.User.update({ last_activity_at: results[1] }, { where: { id: user.id }})
                })
                .then(() => {
                    logger.info('Average heart rate: %s', results[2])

                    if (results[2] > config.heartrate.threshold.upper_limit) {
                        let message = i18n.__('messages.threshold_over', config.heartrate.threshold.upper_limit, results[2])

                        return line.pushMessage(message)
                    }
                })
        }
    })
}

module.exports = {
    run: () => {
        let promises = []

        return Promise.try(() => {
            logger.info('Search target users.')

            return models.User.findAll()
        })
        .then(results => {
            logger.info('Target users: %s records', results.length)

            results.forEach(user => {
                promises.push(check(user))
            })

            return Promise.all(promises)
        })
    }
}
