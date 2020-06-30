const router = require("express").Router();
const request = require("request");
const models = require("../../models");
const auth = require("../../middleware/auth");
const errors = require("../../middleware/errors");
const solr = require("../../middleware/solr");

const requestBody = (docId) => {
  return {
    params: {
      q: "id:" + docId,
      fl: "id,document,title,zusatz,ScanDate,link",
    },
  };
};

// get favorites of logged in user as Array
router.get("/", auth, async (req, res, next) => {
  try {
    if (!req.LoginId) return next(new errors.UnauthorizedError());
    var favorites = await models.Favorite.findAll({
      where: {
        LoginId: req.LoginId,
      },
    });
    favorites = await Promise.all(
      favorites.map(async (fav) => {
        const data = await solr.post("/select", requestBody(fav.DocId));
        const docs = data.response.docs;
        if (docs.length > 0) {
          return {
            DocId: fav.DocId,
            document: docs[0].document,
            title: docs[0].title,
            zusatz: docs[0].zusatz,
            ScanDate: docs[0].ScanDate.split("T")[0],
            link: docs[0].link,
          };
        }
        const doc = await models.DeletedDocs.findOne({
          where: {
            DocId: fav.DocId,
          },
        });
        return {
          DocId: fav.DocId,
          title: doc.title,
          document: doc.document,
          zusatz: doc.zusatz,
          ScanDate: doc.deletedOn,
          link: null,
        };
      })
    );
    res.status(200).send(favorites);
  } catch (err) {
    next(err);
  }
});

// get favorite Status of Document
// returns true if favorite else false
router.get("/:DocId", auth, async (req, res, next) => {
  const { DocId } = req.params;
  try {
    if (!req.LoginId) return next(new errors.UnauthorizedError());
    var fav = await models.Favorite.findOne({
      where: { DocId: DocId, LoginId: req.LoginId },
    });
    if (!fav) res.send(200).send(true);
    else res.send(200).send(false);
  } catch (err) {
    next(err);
  }
});

// Toggle Doc as favorite for logged in user
router.put("/:DocId", auth, async (req, res, next) => {
  const DocId = req.params.DocId;

  try {
    if (!req.LoginId) return next(new errors.UnauthorizedError());
    var fav = await models.Favorite.findOne({
      where: { DocId: DocId, LoginId: req.LoginId },
    });
    if (fav) {
      await fav.destroy();
      res.status(200).send(false);
    } else {
      request.post(
        {
          url: solr + "/select",
          body: {
            params: {
              q: "id:" + DocId,
              fl: "id",
            },
          },
          json: true,
        },
        async (err, httpResponse, body) => {
          if (err) return next(new errors.InternalError(err));
          if (body.responseHeader.status != 0)
            return next(new errors.SolrBackendError());
          if ((body.response.numFound = 0))
            return next(new errors.SolrDocumentDoesntExistError());
          await models.Favorite.create({
            DocId: DocId,
            LoginId: req.LoginId,
          });
          res.status(200).send(true);
        }
      );
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
