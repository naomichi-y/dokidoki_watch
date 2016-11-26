'use strict'

const eazyLogger = require('eazy-logger')

module.exports = () => {
    return eazyLogger.Logger({
        useLevelPrefixes: true,
        level: 'debug',
        prefixes: {
            'trace': "trace: ",
            'debug': "{yellow:debug}: ",
            'info':  "{cyan:info}: ",
            'warn':  "{magenta:warn}: ",
            'error': "{red:error}: "
        }
    });
}()
