const router = require("express").Router();
const crawlers = require("../../crawlers");
const auth = require("../../middleware/auth");

router.get("/", auth, (req, res, next) => {
  res.status(200).send(
    Object.keys(crawlers).map((c) => ({
      name: c,
      status: crawlers[c].status,
      message: crawlers[c].output[crawlers[c].output.length - 1],
      timeleft: crawlers[c].timeleft,
      progress: crawlers[c].progress,
    }))
  );
});

router.get("/:crawler/start", auth, (req, res, next) => {
  const { crawler } = req.params;
  crawlers[crawler].start();
  res.status(200).send();
});

module.exports = router;
