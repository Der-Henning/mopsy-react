const router = require("express").Router();
const auth = require("../../../middleware/auth");
const solr = require("../../../middleware/solr");
const errors = require("../../../middleware/errors");
const fs = require("fs");
const redis = require("redis");
const config = require("../../../config");
const axios = require("axios");

const redisClient = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  return_buffers: true
});

const pageStyle = {
  padding: "20px 0px",
  borderBottom: "solid black 2px"
}

router.get("/:DocId", async (req, res, next) => {
  const format = req.query.format || "pdf";
  const download = req.query.download || false;
  const { DocId } = req.params;

  try {
    if (format === "txt") {
      const data = await solr.post("/select", {
        q: `id:${DocId}`,
        fl: `*_page_*`,
      });
      if ((data.response.numFound = 0))
        return next(new errors.SolrDocumentDoesntExistError());
      const doc = data.response.docs[0];
      var pages = [];

      Object.keys(doc).forEach((page) => {
        pages.push(doc[page]);
      });

      res.status(200).render("index", { pages });
    } else {
      const data = await solr.post("/select", {
        q: `id:${DocId}`,
        fl: `link,file`,
      });
      if ((data.response.numFound = 0))
        return next(new errors.SolrDocumentDoesntExistError());
      const doc = data.response.docs[0];
      
      redisClient.get(DocId, async (err, file) => {
        if (err) throw next(err);
        if (!file) {
          if (doc.file) {
            file = fs.readFileSync(doc.file);
            redisClient.set(DocId, file, '12 hours');
          } else if (doc.link) {
            const data = await axios.get(doc.link, { responseType: 'arraybuffer' })
            file = data.data
            redisClient.set(DocId, file, '12 hours');
            // res.redirect(doc.link);
          }
        }
        if (file) {
          res.contentType("application/pdf");
          res.status(200).send(file);
        } else return next(new errors.ResourceNotFoundError("Link or File"));
      });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
