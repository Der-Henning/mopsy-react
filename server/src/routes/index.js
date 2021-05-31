const router = require("express").Router();
const path = require("path");

router.get("/*", function(req, res, next) {
  console.log("getting build react")
  res.sendFile(path.join(__dirname, "../../../client/build", "index.html"));
});

module.exports = router;