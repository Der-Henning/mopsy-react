const router = require("express").Router();
const models = require("../../../models");
const errors = require("../../../middleware/errors");
const solr = require("../../../middleware/solr");

// search
router.post("/", async (req, res, next) => {
  const { userId } = req.session;
  const q = req.query.q || "*";
  const page = req.query.page || 1;
  try {
    var fq = [];
    if (req.body.fq) {
      const fields = await solr.facetFields()
      fq = req.body.fq.map(f => (`${fields[f[0]].field}:"${f[1]}"`))
    }
    if (userId && req.body.onlyFavs) {
      var favs = await models.Favorite.findAll({
        where: { UserId: userId, },
        attributes: ["DocId"],
        raw: true,
      });
      if (favs.length > 0) {
        var favorites = favs.map((fav) => fav.DocId);
        fq = fq.concat("id:(" + favorites.join(" OR ") + ")");
      }
    }
    const data = await solr.search(q, page, fq);
    if (userId) {
      data.response.docs = await Promise.all(
        data.response.docs.map(async (doc) => ({
          ...doc,
          isFavorite: (await models.Favorite.findOne({
            where: {
              UserId: userId,
              DocId: doc.id,
            },
          })),
        }))
      );
    }
    res.status(200).send(data);
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// post /search process to save search log
// save and increment query and count
router.post("/", (req, res, next) => {
  const q = req.query.q;
  const page = req.query.page || 1;

  try {
    if (q && page == 1) {
      models.Log.create({
        query: q,
        remoteAddress: req.ip,
        sessionID: req.sessionID,
      });
      var terms = q.split(" ");
      for (let term of terms) {
        models.Query.findOrCreate({
          where: { query: term },
          defaults: {},
        }).then(([query, created]) => {
          query.increment("counter", { by: 1 });
        });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

// get search suggestions
router.get("/suggest", async (req, res, next) => {
  const { q } = req.query;
  try {
    if (!q) return next(new errors.MissingParameterError());
    const data = await solr.suggest(q);
    res.send(
      data.suggest.mySuggester[q].suggestions.map((t) =>
        t.term.replace(/<(.|\n)*?>/g, "")
      )
    );
  } catch (err) {
    next(err);
  }
});

// get search pages hits for document
router.get("/:DocId", async (req, res, next) => {
  const q = req.query.q || "*";
  const DocId = req.params.DocId;
  try {
    const data = await solr.search_pages(q, DocId);
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
});

// get page of document
router.get("/:DocId/:page", async (req, res, next) => {
  const { DocId, page } = req.params;
  try {
    const data = await solr.select_doc(DocId, `p_${page}_page_*`)
    if ((data.response.numFound = 0))
      return next(new errors.SolrDocumentDoesntExistError());
    var doc = data.response.docs[0];
    Object.keys(doc).forEach((p) => {
      doc[p.split("_")[1]] = doc[p];
      delete doc[p];
    });
    res.status(200).send(doc);
  } catch (err) {
    next(err);
  }
});

// proxy /select request to SOLR backend
router.post("/select", async (req, res, next) => {
  try {
    const data = await solr.post("/select", req.body);
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
});

// get data for specific document
router.get("/select/:DocId", async (req, res, next) => {
  const { DocId } = req.params;
  try {
    const data = await solr.select_doc(DocId)
    res.send(data);
  } catch (err) {
    next(err);
  }
});

// get top queries, takes count as input, default 30
router.get("/tagcloud", async (req, res, next) => {
  const count = req.query.count ? parseInt(req.query.count, 10) : 30;
  try {
    const queries = await models.Query.findAll({
      limit: count,
      order: [["counter", "DESC"]],
      attributes: ["query", "counter"],
    });
    res.status(200).send(queries);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
