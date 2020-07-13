const router = require("express").Router();
const auth = require("../../../middleware/auth");
const solr = require("../../../middleware/solr");
const fs = require("fs");

router.get("/:DocId", async (req, res, next) => {
  try {
    const { DocId } = req.params;
    const data = await solr.post("/select", { q: `id:${DocId}`, fl: "file" });
    if ((data.response.numFound = 0))
      return next(new errors.SolrDocumentDoesntExistError());
    const doc = data.response.docs[0];
    const file = fs.readFileSync(doc.file);
    res.contentType("application/pdf");
    res.status(200).send(file);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
