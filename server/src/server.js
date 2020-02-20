'use strict';
import "core-js/stable";
import "regenerator-runtime/runtime";

const express     = require('express');
const bodyparser  = require('body-parser');
const path        = require('path');
const server      = express();
const models      = require('./models');
const apiRouter   = require('./routes/api');
const loginRouter = require('./routes/login');
const indexRouter = require('./routes/index');
const proxyRouter = require('./routes/proxy');
const config      = require('./config');

var port = normalizePort(config.port || '4000');

server.use(bodyparser.urlencoded({ extended: true }));

server.use('/', indexRouter);
server.use('/api', apiRouter);
server.use('/api', loginRouter);
server.use('/proxy', proxyRouter);
server.use(express.static(path.join(__dirname, '../../client/build')));

server.get('*', (req,res) =>{
  res.redirect('/');
});

models.sequelize.sync().then(() => {
  server.listen(port, () => {
    console.log('Express server listening on port ' + port);
  });
});

function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}