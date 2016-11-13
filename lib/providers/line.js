'use strict'

const config = require('config')
const https = require('https')

module.exports = {
    pushMessage: message => {
        let options = {
            hostname: 'api.line.me',
            path: '/v2/bot/message/push',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Authorization': `Bearer ${config.line.channel_access_token}`
            },
            method: 'POST',
        };
        let data = JSON.stringify({
            to: config.line.id,
            messages: [{type: 'text', text: message}]
        });

        return new Promise((resolve, reject) => {
            let req = https.request(options, res => {
                res.on('data', res => {
                    resolve()
                }).on('error', err => {
                    reject(err)
                });
            });
            req.write(data);
            req.end();
        })
    }
}
