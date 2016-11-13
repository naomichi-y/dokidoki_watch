'use strict'

let i18n = require('i18n')

module.exports = {
    configure: () => {
        i18n.configure({
            locales: ['ja'],
            defaultLocale: 'ja',
            directory: __dirname + './../config/locales',
            objectNotation: true
        });

        return i18n
    }
}
