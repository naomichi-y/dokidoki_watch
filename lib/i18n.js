'use strict'

const i18n = require('i18n')

module.exports = {
    configure: () => {
        i18n.configure({
            locales: ['en', 'ja'],
            defaultLocale: 'en',
            directory: __dirname + './../config/locales',
            objectNotation: true
        });

        return i18n
    }
}
