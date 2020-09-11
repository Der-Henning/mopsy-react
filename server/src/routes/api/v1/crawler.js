const router = require("express").Router();
const { crawlers, crawlerModules } = require("../../../crawlers");
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
    res.status(200).send();
  } catch (err) {
    next(err);
  }
});

router.put("/:crawler", auth, (req, res, next) => {
  const { crawler } = req.params;
});

router.get("/:crawler/start", auth, (req, res, next) => {
  const { crawler } = req.params;
  crawlers()[crawler].start();
  res.status(200).send();
});

router.get("/:crawler/stop", auth, (req, res, next) => {
  const { crawler } = req.params;
  // if (crawlers[crawler]["stop"]) {
  crawlers()[crawler].stop();
  // delete crawlers[crawler]["stop"];
  // }
  res.status(200).send();
});

module.exports = router;
