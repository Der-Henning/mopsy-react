const router = require("express").Router();
const solr = require("../../../middleware/solr");
const errors = require("../../../middleware/errors");
const redis = require("redis");
const config = require("../../../config");
const axios = require("axios");

const redisClient = redis.createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port
  }
});

redisClient.on('error', (err) => {
  console.log('Redis error: ' + err);
});

router.get("/:DocId", async (req, res, next) => {
  const format = req.query.format || "pdf";
  // const download = req.query.download || false;
  const { DocId } = req.params;
  try {
    if (format === "txt") {
      const data = await solr.post("/select", {
        query: `id:"${DocId}"`,
        fields: `*_page_*`,
      });
      if ((data.response.numFound = 0)) { return next(new errors.SolrDocumentDoesntExistError()); }
      const doc = data.response.docs[0];
      var pages = [];
      Object.keys(doc).forEach((page) => {
        pages.push(doc[page]);
      });
      res.status(200).render("index", { pages });
    } else {
      var doc = null;
      try {
        await redisClient.connect();
      } catch (error) { }
      try {
        doc = await redisClient.get(`link_${DocId}`);
      } catch (error) {
        console.log(error);
      }
      if (!doc) {
        const data = await solr.post("/select", {
          query: `id:"${DocId}"`,
          fields: `link,file`,
        });
        if ((data.response.numFound = 0)) { return next(new errors.SolrDocumentDoesntExistError()); }
        doc = data.response.docs[0];
        try {
          redisClient.set(`link_${DocId}`, JSON.stringify(doc), { EX: config.redis.expire });
        } catch (error) {
          console.log(error);
        }
      } else {
        doc = JSON.parse(doc);
      }
      if (doc.file) {
        res.sendFile(doc.file);
      } else if (doc.link) {
        axios({
          method: 'get',
          url: doc.link,
          responseType: 'stream',
        }).then((response) => {
          response.data.pipe(res);
        })

      } else if (config.pdf_dummy) {
        res.sendFile(config.pdf_dummy);
      } else {
        return next(new errors.ResourceNotFoundError("Link or File"));
      }
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
