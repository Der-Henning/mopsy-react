const router = require("express").Router();
// const { crawlers, crawlerModules, init, start, stop } = require("../../../crawlers");
const auth = require("../../../middleware/auth");
const models = require("../../../models");
const config = require("../../../config");
const Axios = require("axios")

router.get("/", auth, async (req, res, next) => {
  let data = {}
  await Promise.all(config.crawlers.map(async crawler => {
    try {
      const c = await Axios.get(`http://${crawler}`)
      data = {
        ...data,
        [crawler]: c.data
      }
    } catch (err) {
      console.log(err);
    }
  }))
  res.status(200).send(data)
})

router.get("/:crawler/start", auth, async (req, res, next) => {
  const { crawler } = req.params;
  try {
    const response = Axios.post(`http://${crawler}/start`)
    res.status(200).send(response);
  } catch(err) {
    next(err);
  }
});

router.get("/:crawler/stop", auth, async (req, res, next) => {
  const { crawler } = req.params;
  try {
    const response = Axios.post(`http://${crawler}/stop`)
    res.status(200).send(response);
  } catch(err) {
    next(err);
  }
});

// router.get("/", auth, (req, res, next) => {
//   res.status(200).send(crawlers());
// });

// router.get("/modules", auth, (req, res, next) => {
//   res.status(200).send(crawlerModules);
// });

// router.post("/", auth, async (req, res, next) => {
//   // const { module, name, cron, args, compareMethod } = req.body;
//   try {
//     await models.Crawler.create(req.body.data);
//     init();
//     res.status(200).send();
//   } catch (err) {
//     next(err);
//   }
// });

// router.put("/:crawler", auth, (req, res, next) => {
//   const { crawler } = req.params;
//   init();
// });

// router.get("/:crawler/start", auth, (req, res, next) => {
//   const { crawler } = req.params;
//   start(crawler);
//   res.status(200).send();
// });

// router.get("/:crawler/stop", auth, (req, res, next) => {
//   const { crawler } = req.params;
//   // if (crawlers[crawler]["stop"]) {
//   stop(crawler);
//   // delete crawlers[crawler]["stop"];
//   // }
//   res.status(200).send();
// });

module.exports = router;
