'use strict'

module.exports = () => {
    return function(err, req, res, next) {
        if (err) {
            res.status(500).send(err.stack)
        }
    }
}
