const router = require("express").Router();
const auth = require("../../../middleware/auth");
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
  data = Object.keys(data).sort().reduce((result, key) => (
    { ...result, [key]: data[key] }), {})
  res.status(200).send(data)
})

router.get("/:crawler/start", auth, async (req, res, next) => {
  const { crawler } = req.params;
  try {
    const response = await Axios.post(`http://${crawler}/start`)
    res.status(200).send(response.data);
  } catch (err) {
    next(err);
  }
});

router.get("/:crawler/stop", auth, async (req, res, next) => {
  const { crawler } = req.params;
  try {
    const response = await Axios.post(`http://${crawler}/stop`)
    res.status(200).send(response.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
