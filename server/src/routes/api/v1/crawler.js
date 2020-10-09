const router = require("express").Router();
const { crawlers, crawlerModules, init, start, stop } = require("../../../crawlers");
const auth = require("../../../middleware/auth");
const models = require("../../../models");

router.get("/", auth, (req, res, next) => {
  res.status(200).send(crawlers());
});

router.get("/modules", auth, (req, res, next) => {
  res.status(200).send(crawlerModules);
});

router.post("/", auth, async (req, res, next) => {
  // const { module, name, cron, args, compareMethod } = req.body;
  try {
    await models.Crawler.create(req.body.data);
    init();
    res.status(200).send();
  } catch (err) {
    next(err);
  }
});

router.put("/:crawler", auth, (req, res, next) => {
  const { crawler } = req.params;
  init();
});

router.get("/:crawler/start", auth, (req, res, next) => {
  const { crawler } = req.params;
  start(crawler);
  res.status(200).send();
});

router.get("/:crawler/stop", auth, (req, res, next) => {
  const { crawler } = req.params;
  // if (crawlers[crawler]["stop"]) {
  stop(crawler);
  // delete crawlers[crawler]["stop"];
  // }
  res.status(200).send();
});

module.exports = router;
