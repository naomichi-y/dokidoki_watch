'use strict'

const http = require('http')
const https = require('https')
const tunnel = require('tunnel')

let accessToken = 'iEQsO+T3eN4GWwH41UFexGZjzFv146pZ/GIMxjH7UZc7MWKSNgOp17HAjYzHbwQpcpDxxwXviNCzqGYvp2CYXyfKS7tF8YW8OgGiLSNMHKrnhc3C5d3qKg7pwa6ZVObj1oaIUHcP4d/R7ourddNb0gdB04t89/1O/w1cDnyilFU'

http.createServer((req, res) => {
    let fixieAgent = tunnel.httpsOverHttp({
        proxy: {
            host: 'velodrome.usefixie.com',
            port: 80,
            proxyAuth: 'fixie:Sui8h3B9XYebgcj',
        }
    })

    let anonymousAgent = tunnel.httpsOverHttp({
        proxy: {
            host: '124.255.23.45',
            port: 80,
        }
    })

    let options = {
        //host: 'kakunin.teraren.com',
        host: 'api.line.me',
        port: 443,
        path: '/v2/bot/message/push',
        //agent: fixieAgent,
        agent: anonymousAgent,
        method: 'POST',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer ' + accessToken,
        },
    }
    let req2 = https.request(options, results => {
        console.log('Status code: ' + results.statusCode)
        console.log('Headers: ' + JSON.stringify(results.headers))

        results.on('data', results => {
            console.log(results.toString())
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end('ok')
        }).on('error', err => {
            res.writeHead(500, {'Content-Type': 'text/plain'})
            res.end('err')
        })
    })
    let data = JSON.stringify({
        to: 'Uce8aede08f283c3c32f03057209fe126',
        messages: [{type: 'text', text: 'b'}]
    })

    req2.write(data)
    req2.end()

}).listen(3000)
