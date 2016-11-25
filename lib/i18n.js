'use strict'

const i18n = require('i18n')
const config = require('config')

module.exports = {
    configure: () => {
        i18n.configure({
            locales: ['en', 'ja'],
            defaultLocale: config.i18n.default_locale,
            directory: __dirname + './../config/locales',
            objectNotation: true
        });

        return i18n
    }
}
