"use strict";
import "core-js/stable";
import "regenerator-runtime/runtime";

const express = require("express");
const session = require("express-session");
const path = require("path");
const server = express();
const models = require("./models");
const apiRouter = require("./routes/api/v1");
const indexRouter = require("./routes/index");
const config = require("./config");
const compression = require("compression");
const SequelizeStore = require("connect-session-sequelize")(session.Store);

var port = normalizePort(config.port || "4000");

const apiVersion = "v1";

server.use(session({
  secret: config.sessionkey,
  resave: false,
  store: new SequelizeStore({
    db: models.sequelize
  }),
  maxAge: 24 * 3600000
}))

server.set("view engine", "pug");
server.set("views", path.join(__dirname, `routes/api/${apiVersion}/views`));

server.use(express.urlencoded({ extended: true }));
server.use(express.json({ extended: true }));
server.use(compression());

server.use(`/api/${apiVersion}`, apiRouter);
// server.use(
//   express.Router().get("/test", (req, res) => {
//     res.render("index");
//   })
// );
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
