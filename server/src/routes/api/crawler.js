const router = require("express").Router();
const crawlers = require("../../crawlers");
const auth = require("../../middleware/auth");

router.get("/", auth, (req, res, next) => {
  res.status(200).send(
    crawlers.map((c) => ({
      name: c.name,
      status: c.status,
      message: c.output[c.output.length - 1],
      timeleft: c.timeleft,
      progress: c.progress,
    }))
  );
});

module.exports = router;
