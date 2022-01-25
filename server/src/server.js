"use strict";
// import "core-js/stable";
import "regenerator-runtime/runtime";

const express = require("express");
// const cookieParser = require("cookie-parser");
// const csrf = require("csurf");
const session = require("express-session");
const path = require("path");
const models = require("./models");
const apiRouter = require("./routes/api/v1");
const indexRouter = require("./routes/index");
const config = require("./config");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const server = express();
const SequelizeStore = require("connect-session-sequelize")(session.Store);

const port = normalizePort(config.port || "4000");

const apiVersion = "v1";

const apiLimiter = rateLimit({
	windowMs: config.rate_limit_window,
	max: config.rate_limit_max,
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

server.use(session({
  secret: config.sessionkey,
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({
    db: models.sequelize
  }),
  maxAge: 24 * 3600000 // 24h
}))

// server.use(cookieParser());
// server.use(csrf({ cookie: true }));

server.set("view engine", "pug");
server.set("views", path.join(__dirname, `routes/api/${apiVersion}/views`));

server.use(express.urlencoded({ extended: true }));
server.use(express.json({ extended: true }));
server.use(compression());

if (config.rate_limit) server.use('/api', apiLimiter);
server.use(`/api/${apiVersion}`, apiRouter);

server.use(express.static(path.join(__dirname, "../../client/build")));
server.use("/*", indexRouter);

server.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

models.sequelize.sync().then(() => {
  server.listen(port, () => {
    models.User.createAdmin(models);
    console.log("Express server listening on port " + port);
  });
});

function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}
