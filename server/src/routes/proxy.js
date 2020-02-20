const router  = require('express').Router();
const config  = require('../config');
const request = require('request');
 
router.get('/', (req, res, next) => {
    const url = req.query.url;
    if (!url) return res.status(400).send("no url provided");
    request.get(url).pipe(res);
});

module.exports = router;