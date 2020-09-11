"use strict";
import "core-js/stable";
import "regenerator-runtime/runtime";

const express = require("express");
const bodyparser = require("body-parser");
const path = require("path");
const server = express();
const models = require("./models");
const apiRouter = require("./routes/api/v1");
// const indexRouter = require("./routes/index");
const config = require("./config");
const compression = require("compression");
const crawlers = require("./crawlers")

var port = normalizePort(config.port || "4000");

const apiVersion = "v1";

server.set("view engine", "pug");
server.set("views", path.join(__dirname, `routes/api/${apiVersion}/views`));

server.use(bodyparser.urlencoded({ extended: true }));
server.use(compression());

server.use(`/api/${apiVersion}`, apiRouter);
// server.use(
//   express.Router().get("/test", (req, res) => {
//     res.render("index");
//   })
// );
server.use(express.static(path.join(__dirname, "../../client/build")));
// server.use("/*", indexRouter);

server.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

models.sequelize.sync().then(() => {
  server.listen(port, () => {
    models.Login.createAdmin(models);
    crawlers.init();
    console.log("Express server listening on port " + port);
  });
});

function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}
