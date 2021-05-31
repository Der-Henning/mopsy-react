const router = require("express").Router();
const auth = require("../../../middleware/auth");
const solr = require("../../../middleware/solr");
const errors = require("../../../middleware/errors");
const fs = require("fs");
const redis = require("redis");
const config = require("../../../config");
const axios = require("axios");
// const rstream = require("redis-rstream");

const redisClient = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  return_buffers: true,
  detect_buffers: true
});

redisClient.on('error', (err) => {
  console.log('Redis error: ' + err);
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
      redisClient.get(`link_${DocId}`, async (err, doc) => {
        if (err) console.log(err);
        if (!doc) {
          const data = await solr.post("/select", {
            q: `id:${DocId}`,
            fl: `link,file`,
          });
          if ((data.response.numFound = 0))
            return next(new errors.SolrDocumentDoesntExistError());
          doc = data.response.docs[0];
          redisClient.set(`link_${DocId}`, JSON.stringify(doc), 'EX', 60, (err, reply) => {
            if (err) console.log(err);
          });

        } else {
          doc = JSON.parse(doc);
        }

        // doc.file=null;
        // doc.link="https://www.hq.nasa.gov/alsj/a17/A17_FlightPlan.pdf";

        if (doc.file) {
          res.sendFile(doc.file);
        } else if (doc.link) {
          const cacheFile = `${config.pdfCache}/${DocId}`;
          fs.stat(cacheFile, (err, stats) => {
            if (err) {
              axios({
                method: 'get',
                url: doc.link,
                responseType: 'stream',
              }).then((response) => {
                response.data.pipe(res);
                const fileWriteStream = fs.createWriteStream(cacheFile);
                response.data.pipe(fileWriteStream);
                fileWriteStream.on('error', (err) => {
                  console.log(err);
                });
              })
            } else {
              res.sendFile(cacheFile);
            }
          })
        } else if (config.pdf_dummy) {
          res.sendFile(config.pdf_dummy);
        } else {
          return next(new errors.ResourceNotFoundError("Link or File"));
        }

        // redisClient.get(DocId, async (err, file) => {
        //   if (err) console.log(err);
        //   if (!file) {
        //     if (doc.file) {
        //       file = fs.readFileSync(doc.file);
        //     } else if (doc.link) {
        //       const data = await axios.get(doc.link, { responseType: 'arraybuffer' })
        //       file = data?.data
        //       // res.redirect(doc.link);
        //     }
        //     if (file) redisClient.set(DocId, file, 'EX', 60 * config.redis.expire, (err, reply) => {
        //       if (err) console.log(err);
        //     });
        //   }
        //   if (file) {
        //     console.log("sending stream");
        //     // rstream(redisClient,DocId).pipe(res);
        //     res.sendFile(doc.file);
        //     // res.contentType("application/pdf");
        //     // console.log(typeof file);
        //     // res.sendFile(file);
        //   } else if (config.pdf_dummy) {
        //     file = fs.readFileSync(config.pdf_dummy);
        //     res.contentType("application/pdf");
        //     res.sendFile(file, {acceptRanges: true});
        //   } else return next(new errors.ResourceNotFoundError("Link or File"));
        // });
      });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
