const router = require("express").Router();
const crawlers = require("../../../crawlers");
const auth = require("../../../middleware/auth");

router.get("/", auth, (req, res, next) => {
  res.status(200).send(
    Object.keys(crawlers).map((c) => ({
      name: c,
      status: crawlers[c].status,
      message: crawlers[c].message,
      timeleft: crawlers[c].timeleft,
      progress: crawlers[c].progress,
    }))
  );
});

router.get("/:crawler/start", auth, (req, res, next) => {
  const { crawler } = req.params;
  crawlers[crawler]["stop"] = crawlers[crawler].start();
  res.status(200).send();
});

router.get("/:crawler/stop", auth, (req, res, next) => {
  const { crawler } = req.params;
  if (crawlers[crawler]["stop"]) {
    crawlers[crawler].stop();
    delete crawlers[crawler]["stop"];
  }
  res.status(200).send();
});

module.exports = router;
