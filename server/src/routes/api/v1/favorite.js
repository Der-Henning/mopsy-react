const router = require("express").Router();
const models = require("../../../models");
const errors = require("../../../middleware/errors");
const solr = require("../../../middleware/solr");

const apiVersion = "v1";

const requestBody = (docId) => {
  return {
    query: "id:" + docId,
    fields: "id,document,title_*,subtitle_*,scanDate,link,language,deleted,externallink",
  };
};

// get favorites of logged in user as Array
router.get("/", async (req, res, next) => {
  const { userId } = req.session;
  try {
    if (!userId) return next(new errors.UnauthorizedError());
    const favorites = await models.Favorite.findAll({
      where: { UserId: userId },
    });
    var response = []
    if (favorites) {
      await Promise.all(
        favorites.map(async fav => {
          const data = await solr.post("/select", requestBody(fav.DocId));
          const docs = data.response.docs;
          if (docs.length > 0) {
            const doc = docs[0]
            const lang = doc.language.toLowerCase();
            response.push({
              DocId: doc.id,
              document: doc.document,
              title: doc[`title_txt_${lang}`],
              subtitle: doc[`subtitle_txt_${lang}`],
              date: doc.scanDate?.split("T")[0],
              link: doc.link || `/api/${apiVersion}/pdf/${doc.id}`,
              deleted: doc.deleted,
              externallink: doc.externallink
            })
          }
        })
      )
    }
    res.status(200).send(response);
  } catch (err) {
    next(err);
  }
});

// get favorite Status of Document
// returns true if favorite else false
router.get("/:DocId", async (req, res, next) => {
  const { DocId } = req.params;
  const { userId } = req.session;
  try {
    if (!userId) return next(new errors.UnauthorizedError());
    var fav = await models.Favorite.findOne({
      where: { DocId: DocId, UserId: userId },
    });
    if (!fav) res.send(200).send(true);
    else res.send(200).send(false);
  } catch (err) {
    next(err);
  }
});

// Toggle Doc as favorite for logged in user
router.put("/:DocId", async (req, res, next) => {
  const DocId = req.params.DocId;
  const { userId } = req.session;

  try {
    if (!userId) return next(new errors.UnauthorizedError());
    var fav = await models.Favorite.findOne({
      where: { DocId: DocId, UserId: userId },
    });
    if (fav) {
      await fav.destroy();
      res.status(200).send(false);
    } else {
      const data = await solr.post("/select", {
        query: "id:" + DocId,
        fields: "id",
      });
      if ((data.response.numFound = 0))
        return next(new errors.SolrDocumentDoesntExistError());
      await models.Favorite.create({
        DocId: DocId,
        UserId: userId,
      });
      res.status(200).send(true);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
