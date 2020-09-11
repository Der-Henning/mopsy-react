"use strict";

const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

if (isMainThread) {
  const fs = require("fs");
  const models = require("../models");

  var crawlerModules = fs
    .readdirSync(__dirname)
    .filter((file) => {
      return (
        file.indexOf(".") !== 0 &&
        file !== "index.js" &&
        file !== "worker.js" &&
        file.slice(-3) === ".js"
      );
    })
    .map((file) => ({
      ...require("./" + file),
      file,
    }));

  var crawlers = {};

  const init = async () => {
    crawlers = await models.Crawler.findAll();
    crawlers = crawlers.reduce((acc, c) => {
      acc[c.id] = {
        name: c.name,
        module: c.module,
        cron: c.cron,
        args: c.args,
        compareMethod: c.compareMethod,
        createdAt: c.createdAt,
        message: "",
        status: "idle",
        progress: 0,
        timeleft: undefined,
        stop: null,
        start: function() {
          this.status = "running";
          const worker = new Worker(__filename, {
            workerData: {
              name: c.name,
              module: c.module,
              args: c.args,
            },
          });
          (this.stop = function() {
            this.status = "stopped";
            worker.postMessage("stop");
          }),
            worker.on("message", (data) => {
              console.log(data);
              if (data.message) this.message = data.message;
              if (data.progress) this.progress = data.progress;
              if (data.timeleft) this.timeleft = data.timeleft;
            });
          worker.on("error", (err) => {
            this.status = "error";
            this.message = err.message;
            stop = null;
          });
          worker.on("exit", (code) => {
            this.message = `Crawler stopped with exit code ${code}`;
            this.status = "idle";
            stop = null;
          });
        },
      };
      return acc;
    }, {});
  };

  module.exports = {
    crawlerModules,
    crawlers: () => {
      return crawlers;
    },
    init,
  };
} else {
  // const { module,args } = workerData;
  parentPort.postMessage("init");
  const postData = (data) => {
    parentPort.postMessage(data);
  };
  const worker = require("./worker.js");
  // const module = require(module);
  parentPort.on("message", (message) => {
    if (message === "stop") worker.stop();
  });
  worker.start({ ...workerData, postData });
}
