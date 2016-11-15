'use strict'

let eazyLogger = require('eazy-logger')
let moment = require('moment-timezone')

module.exports = () => {
    return eazyLogger.Logger({
        prefix: `level:`,
        useLevelPrefixes: true,
        level: 'debug',
        prefixes: {
            "trace": "trace\tmessage:",
            "debug": "{yellow:debug}\tmessage:",
            "info":  "{cyan:info}\tmessage:",
            "warn":  "{magenta:warn}\tmessage:",
            "error": "{red:error}\tmessage:"
        }
    });
}()
