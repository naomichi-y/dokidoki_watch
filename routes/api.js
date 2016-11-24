'use strict'

const router = require('express-promise-router')()
const api =  require('../controllers').api

router.get('/:username?', api.index)

module.exports = router
