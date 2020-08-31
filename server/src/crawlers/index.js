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
  // var crawlers = {};

  const crawlers = fs
    .readdirSync(__dirname)
    .filter((file) => {
      return (
        file.indexOf(".") !== 0 &&
        file !== basename &&
        file !== "worker.js" &&
        file.slice(-3) === ".js"
      );
    })
    .map((file) => {});
  // .forEach((file) => {
  //   crawlers = {
  //     ...crawlers,
  //     [file.slice(0, -3)]: {
  //       message: "",
  //       status: "idle",
  //       progress: 0,
  //       timeleft: undefined,
  //       // path: path.join(__dirname, file),
  //       documents: require(file),
  //       start: function() {
  //         this.status = "running";
  //         const worker = new Worker("worker.js", {
  //           // workerData: {
  //           //   path: this.path,
  //           // },
  //         });
  //         var stop = () => {
  //           this.status = "stopped";
  //           worker.postMessage("stop");
  //         };
  //         worker.on("message", (data) => {
  //           if (data.message) this.message = data.message;
  //           if (data.progress) this.progress = data.progress;
  //           if (data.timeleft) this.timeleft = data.timeleft;
  //         });
  //         worker.on("error", (err) => {
  //           this.status = "error";
  //           this.message = err.message;
  //           stop = null;
  //         });
  //         worker.on("exit", (code) => {
  //           this.message = `Crawler stopped with exit code ${code}`;
  //           this.status = "idle";
  //           stop = null;
  //         });

  //         return stop;
  //       },
  //     },
  //   };
  // });

  module.exports = crawlers;
} else {
  // const { path } = workerData;
  const postData = (data) => {
    parentPort.postMessage(data);
  };
  const crawler = require("worker.js");
  parentPort.on("message", (message) => {
    if (message === "stop") crawler.stop();
  });
  crawler.start(postData);
}
