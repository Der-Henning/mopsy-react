const router = require("express").Router();
const config = require("../../config");
const request = require("request");
const url = require("url");
const models = require("../../models");
const auth = require("../../middleware/auth");
const errors = require("../../middleware/errors");
const solr = require("../../middleware/solr");

const searchBody = (q, page, fq) => {
  return {
    params: {
      q: q,
      rows: 10,
      start: (page - 1) * 10,
      fq: fq,
      "hl.snippets": 1,
      "hl.fl": "document, title, zusatz",
      "hl.fragsize": 0,
      // "facet": "on",
      // "facet.field": "keywords"
    }
  }
}

const searchPagesBody = (q, DocId) => {
  return {
    params: {
      q: q,
      rows: 1,
      fq: "id:" + DocId,
      "hl.fl": "page_*, meta_*",
      "hl.snippets": 10,
    }
  }
}

// search
router.get("/", auth, async (req, res, next) => {
  const q = req.query.q || "*";
  const page = req.query.page || 1;
  try {
    var fq = [];
    if (req.body.fq) fq = [].concat(req.body.fq);
    if (req.LoginId && req.body.onlyFavs) {
      var favs = await models.Favorite.findAll({
        where: {
          LoginId: req.LoginId
        },
        attributes: ["DocId"],
        raw: true
      });
      if (favs.length > 0) {
        var favorites = favs.map(fav => fav.DocId);
        fq = fq.concat("id:(" + favorites.join(" OR ") + ")");
      }
    }

    const data = await solr.post("/search", searchBody(q, page, fq));
    if (req.LoginId) {
      data.response.docs = await Promise.all(data.response.docs.map(async doc => ({
        ...doc,
        isFavorite: await models.Favorite.findOne({
          where: {
            LoginId: req.LoginId,
            DocId: doc.id
          }
        }) ? true : false
      })))
    }
    
    // insert dummy pdf for external developement
    if (config.pdf_dummy) {
      data.response.docs = data.response.docs.map(doc => ({
        ...doc,
        link: config.pdf_dummy
      }))
    }
    // -----------

    res.status(200).send(data);
    next();
  } catch(err) {
    next(err);
  }
});

// post /search process to save search log
// save and increment query and count
router.get("/", (req, res, next) => {
  const q = req.query.q;
  const page = req.query.page || 1;

  try {
    if (q && page == 1) {
      models.Log.create({
        query: q,
        remoteAddress: req.ip,
        UserId: req.UserId
      });
      var terms = q.split(" ");
      for (let term of terms) {
        models.Query.findOrCreate({ where: { query: term }, defaults: {} }).then(
          ([query, created]) => {
            query.increment("counter", { by: 1 });
          }
        );
      }
    }
  } catch(err) {
    console.log(err);
  }
});

// get search suggestions
router.get("/suggest", auth, async (req, res, next) => {
  const { q } = req.query;

  try {
    if (!q) return next(new errors.MissingParameterError());
    const data = await solr.post("/suggest", { params: {q} });
    res.send(data.suggest.mySuggester[q].suggestions.map(t => t.term.replace(/<(.|\n)*?>/g, '')));
  } catch(err) {
    next(err);
  }
});

// get search pages hits for document
router.get("/:DocId", auth, async (req, res, next) => {
  const q = req.query.q || "*";
  const DocId = req.params.DocId;

  try {
    const data = await solr.post("/search", searchPagesBody(q, DocId));
    res.status(200).send(data);
  } catch(err) {
    next(err);
  }
});

// proxy /select request to SOLR backend
router.post("/select", auth, async (req, res, next) => {
  try {
    const data = await solr.post("/select", { params: req.body});
    res.status(200).send(data);
  } catch(err) {
    next(err);
  }
});

// get data for specific document
router.post("/select/:DocId", auth, async (req, res, next) => {
  const { DocId } = req.params;
  try {
    const data = await solr.post("/select", { params: { q: "id:" + DocId }});
    res.send(data);
  } catch(err) {
    next(err);
  }
});

// get top queries, takes count as input, default 30
router.get("/tagcloud", auth, async (req, res, next) => {
  const count = req.query.count ? parseInt(req.query.count, 10) : 30;
  try {
    const queries = await models.Query.findAll({
      limit: count,
      order: [["counter", "DESC"]],
      attributes: ["query", "counter"]
    });
    res.status(200).send(queries);
  } catch(err) {
    next(err);
  }
});

module.exports = router;
