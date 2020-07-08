"use strict";

const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

if (isMainThread) {
  const fs = require("fs");
  const path = require("path");
  const basename = path.basename(__filename);
  const config = require("../config");
  var crawlers = {};

  fs.readdirSync(__dirname)
    .filter((file) => {
      return (
        file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
      );
    })
    .forEach((file) => {
      crawlers = {
        ...crawlers,
        [file.slice(0, -3)]: {
          output: [],
          status: "stopped",
          progress: 0,
          timeleft: undefined,
          path: path.join(__dirname, file),
          start: function() {
            this.status = "running";
            const solr = require("../middleware/solr");
            const worker = new Worker(__filename, {
              workerData: {
                path: this.path,
              },
            });
            worker.on("message", (data) => {
              if (data.message) this.output.push(data.message);
              if (data.progress) this.progress = data.progress;
              if (data.timeleft) this.timeleft = data.timeleft;
            });
            worker.on("error", (err) => {
              this.status = "error";
              this.output.push(err);
            });
            worker.on("exit", (code) => {
              this.output.push(`Worker stopped with exit code ${code}`);
              if (code === 0) this.status = "finished";
              console.log(this.output);
            });
          },
        },
      };
    });

  module.exports = crawlers;
} else {
  const { path } = workerData;
  const postData = (data) => {
    parentPort.postMessage(data);
  };
  const crawler = require(path);
  crawler(postData);
}
