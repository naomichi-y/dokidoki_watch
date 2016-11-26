'use strict'

const express = require('express')
const router = express.Router()
const users = require('../controllers').users

router.get('/new', users.new)

module.exports = router;
