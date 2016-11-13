'use strict'

let config = require('config')
let _ = require('lodash');
let moment = require('moment-timezone')

module.exports = {
    heartrateEndpoint: timezone => {
        let date = moment().tz('asia/tokyo')

        let beginDate = date.clone().subtract(config.heartrate.monitoring.minutes_begin_ago, 'm')
        let targetBeginDate = beginDate.format('YYYY-MM-DD')
        let targetBeginTime = beginDate.format('HH:mm')

        let endDate = date.clone().subtract(config.heartrate.monitoring.minutes_end_ago, 'm')
        let targetEndDate = endDate.format('YYYY-MM-DD')
        let targetEndTime = endDate.format('HH:mm')

        let endpoint = `/activities/heart/date/${targetBeginDate}/${targetEndDate}/time/${targetBeginTime}/${targetEndTime}.json`

        return endpoint
    }
}
