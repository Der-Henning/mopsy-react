const router = require("express").Router();
const config = require("../../config");
const request = require("request");
const url = require("url");
const models = require("../../models");
const auth = require("../../middleware/auth");
const errors = require("../../middleware/errors");

// build solr url for SOLR backend requests
const solr = url.format({
  protocol: "http",
  hostname: config.solr_host,
  port: config.solr_port,
  pathname: "solr/" + config.solr_core
});

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
    
    request.post(
      {
        url: solr + "/search",
        body: searchBody(q, page, fq),
        json: true
      },
      async (err, httpResponse, body) => {
        try {
          if (body.responseHeader.status == 0) {
            if (req.LoginId) {
              body.response.docs = await Promise.all(body.response.docs.map(async doc => ({
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
              body.response.docs = body.response.docs.map(doc => ({
                ...doc,
                link: config.pdf_dummy
              }))
            }
            // -----------

            res.status(200).send(body);
            next();
          } else {
            throw new errors.SolrBackendError();
            //res.status(body.responseHeader.status).send("SOLR backend error");
          }
        } catch (err) {
          throw new errors.InternalError(err);
        }
      }
    );
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
router.get("/suggest", auth, (req, res, next) => {
  const { q } = req.query;

  try {
    if (!q) return next(new errors.MissingParameterError());
    request.post(
      {
        url: solr + "/suggest",
        body: {
          params: {
            q: q
          }
        },
        json: true
      },
      (err, httpResponse, body) => {
        if (err) return next(err);
        if (body.responseHeader.status !== 0) return next(new errors.SolrBackendError());
        res.send(body.suggest.mySuggester[q].suggestions.map(t => t.term.replace(/<(.|\n)*?>/g, '')));
      }
    );
  } catch(err) {
    next(err);
  }
});

router.get("/:DocId", auth, async (req, res, next) => {
  const q = req.query.q || "*";
  const DocId = req.params.DocId;

  try {
    request.post(
      {
        url: solr + "/search",
        body: searchPagesBody(q, DocId),
        json: true
      },
      (err, httpResponse, body) => {
        try {
          if (body.responseHeader.status == 0) {
            res.status(200).send(body);
          } else {
            throw new errors.SolrBackendError();
            //res.status(body.responseHeader.status).send("SOLR backend error");
          }
        } catch (err) {
          throw new errors.InternalError(err);
        }
      }
    );
  } catch(err) {
    next(err);
  }
});

// proxy /select request to SOLR backend
router.post("/select", auth, (req, res, next) => {
  request.post(
    {
      url: solr + "/select",
      body: {
        params: req.body
      },
      json: true
    },
    (err, httpResponse, body) => {
      if (err) return res.status(httpResponse).send(err);
      res.status(200).send(body);
    }
  );
});

// get data for specific document
router.post("/select/:DocId", auth, (req, res, next) => {
  const { DocId } = req.params;
  request.post(
    {
      url: solr + "/select",
      body: {
        params: { q: "id:" + DocId }
      },
      json: true
    },
    (err, httpResponse, body) => {
      if (err) return res.status(httpResponse).send(err);
      if (body.response.numFound < 1)
        return res.status(400).send("document doesn't exist");
      res.status(200).send(body.response.docs[0]);
    }
  );
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
