'use strict'

const express = require('express')
const router = express.Router()
const receiver = require('../controllers').receiver

router.get('/fitbit/callback', receiver.callback)

module.exports = router;
