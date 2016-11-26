'use strict'

const express = require('express')
const router = express.Router()
const api =  require('../controllers').api

router.get('/:username?', api.index)

module.exports = router
