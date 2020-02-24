const router  = require('express').Router();
const config  = require('../config');
const request = require('request');
 
router.all( '/*', function( req, res ){
    req.pipe( request({
        url: req.params[0],
        qs: req.query,
        method: req.method
    }, function(error, response, body){
        if (error){
            res.status(500).send(error);
        }
    })).pipe( res );
});

module.exports = router;