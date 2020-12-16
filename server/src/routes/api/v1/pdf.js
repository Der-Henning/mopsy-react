const router = require("express").Router();
const auth = require("../../../middleware/auth");
const solr = require("../../../middleware/solr");
const errors = require("../../../middleware/errors");
const fs = require("fs");

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
      // console.log(pages);

      res.status(200).render("index", {pages});
    } else {
      const data = await solr.post("/select", {
        q: `id:${DocId}`,
        fl: `link,file,formats`,
      });
      if ((data.response.numFound = 0))
        return next(new errors.SolrDocumentDoesntExistError());
      const doc = data.response.docs[0];
      // doc.formats = doc.formats.map((f) => f.toLowerCase());
      // if (!doc.formats.includes(format))
      //   return next(new errors.ResourceNotFoundError("Format"));
      if (doc.file) {
        const file = fs.readFileSync(doc.file);
        res.contentType("application/pdf");
        res.status(200).send(file);
      } else if (doc.link) {
        res.redirect(doc.link);
      } else return next(new errors.RessourceNotFoundError("Link or File"));
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
