'use strict'

const router = require('express-promise-router')()
const users = require('../controllers').users

router.get('/new', users.new)

module.exports = router;
