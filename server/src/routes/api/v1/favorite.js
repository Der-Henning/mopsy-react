const router = require("express").Router();
const models = require("../../../models");
const errors = require("../../../middleware/errors");
const solr = require("../../../middleware/solr");

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
        favorites.map(async (fav) => {
          const data = await solr.select_doc(fav.DocId);
          response.push(...data.response.docs);
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
      const data = await solr.select_doc("DocId", { fields: "id" })
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
