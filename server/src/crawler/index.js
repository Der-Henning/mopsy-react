const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

if (isMainThread) {
  module.exports = () => {
    const solr = require("../middleware/solr");
    const worker = new Worker(__filename, {
      workerData: 10,
    });
    worker.on("message", (message) => console.log(message));
    worker.on("error", (err) => {
      console.log(err);
    });
    worker.on("exit", (code) => {
      console.log(`Worker stopped with exit code ${code}`);
    });
  };
} else {
  
  function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }
  console.log(workerData);
  sleep(500);
  parentPort.postMessage(workerData + 1);

  sleep(500);

  parentPort.postMessage(workerData + 2);

  throw new Error("fehler");
  //   for (var i; i < parseInt(workerData); i++) {
  //     console.log("jhj");
  //     sleep(100);
  //     parentPort.postMessage(i);
  //   }
}
