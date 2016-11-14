'use strict'

let config = require('config')
let _ = require('lodash');
let moment = require('moment-timezone')

module.exports = {
    heartrateEndpoint: timezone => {
        let date = moment().tz(timezone)

        let beginOffset = config.heartrate.monitoring.minutes_range + config.heartrate.monitoring.minutes_ago - 1
        let beginDate = date.clone().subtract(beginOffset, 'm')
        console.log(beginDate)
        let targetBeginDate = beginDate.format('YYYY-MM-DD')
        let targetBeginTime = beginDate.format('HH:mm')

        let endOffset = config.heartrate.monitoring.minutes_ago
        let endDate = date.clone().subtract(endOffset, 'm')
        let targetEndDate = endDate.format('YYYY-MM-DD')
        let targetEndTime = endDate.format('HH:mm')

        let endpoint = `/activities/heart/date/${targetBeginDate}/${targetEndDate}/time/${targetBeginTime}/${targetEndTime}.json`

        return endpoint
    }
}
