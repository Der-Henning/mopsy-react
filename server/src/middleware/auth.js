const jwt = require('jsonwebtoken');
const config = require('../config');
const errors = require('./errors');

module.exports = function(req, res, next) {
  //get the token from the header if present
  const token = req.headers["x-access-token"] || req.headers["authorization"];
  //if no token found, return response (without going to the next middelware)
  if (!token) return next(new errors.AuthenticationError());
  
try {
    //if can verify the token, set req.user and pass to next middleware
    const decoded = jwt.verify(token, config.myprivatekey);
    req.UserId = decoded.UserId;
    if (decoded.LoginId) req.LoginId = decoded.LoginId;
      next();
    } catch (ex) {
    //if invalid token
      next(ex);
    //res.status(400).send("Invalid token.");
    }
};