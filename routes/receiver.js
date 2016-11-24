'use strict'

const router = require('express-promise-router')()
const receiver = require('../controllers').receiver

router.get('/fitbit/callback', receiver.callback)

module.exports = router;
