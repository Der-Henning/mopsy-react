const router = require("express").Router();
const config = require("../../config");
const models = require("../../models");
const auth = require("../../middleware/auth");
const errors = require("../../middleware/errors");
// const solr = require("../../middleware/solr");
const axios = require("axios");
const url = require("url");
const qs = require("qs");

// build solr url for SOLR backend requests
const solr = url.format({
  protocol: "http",
  hostname: config.solr.host,
  port: config.solr.port,
  pathname: "solr/" + config.solr.core,
});

// const searchParams = {
//   echoParams: "none",
//   defType: "dismax",
//   qf: "title^2.0 authors^2.0 publishers^2.0 tags^3.0",
//   rows: 10,
//   fl: "id,title,authors,page_*,score,path",
//   wt: "json",
//   ps: 50,
//   qs: 4,
//   tie: 0.5,
//   "hl.simple.post": "</b>",
//   "hl.simple.pre": "<b>"
// }

const searchBody = (q, page, fq) => {
  return {
    params: {
      // ...searchParams,
      q: q,
      rows: 10,
      start: (page - 1) * 10,
      fq: fq,
      hl: "on",
      "hl.snippets": 1,
      "hl.fl": "title_*",
      "hl.fragsize": 0,
      facet: "off",
    },
  };
};

const searchPagesBody = (q, DocId) => {
  return {
    params: {
      // ...searchParams,
      q: q,
      rows: 1,
      fq: "id:" + DocId,
      hl: "on",
      "hl.fl": "*_page_*",
      "hl.snippets": 10,
      facet: "off",
    },
  };
};

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
          LoginId: req.LoginId,
        },
        attributes: ["DocId"],
        raw: true,
      });
      if (favs.length > 0) {
        var favorites = favs.map((fav) => fav.DocId);
        fq = fq.concat("id:(" + favorites.join(" OR ") + ")");
      }
    }
    // const data = await solr.post("/select", searchBody(q, page, fq));
    const { data } = await axios.post(
      solr + "/search",
      qs.stringify(searchBody(q, page, fq).params)
    );
    if (req.LoginId) {
      data.response.docs = await Promise.all(
        data.response.docs.map(async (doc) => ({
          id: doc.id,
          title: doc["title_txt_" + doc.language],
          authors: doc.authors,
          language: doc.language,
          path: doc.path,
          isFavorite: (await models.Favorite.findOne({
            where: {
              LoginId: req.LoginId,
              DocId: doc.id,
            },
          }))
            ? true
            : false,
        }))
      );
    }
    Object.keys(data.highlighting).forEach((d) => {
      Object.keys(data.highlighting[d]).forEach((f) => {
        if (RegExp("p_[0-9]*_page_txt_[a-z]*").test(f)) {
          data.highlighting[d]["page_" + f.split("_")[1]] =
            data.highlighting[d][f];
          delete data.highlighting[d][f];
        }
        if (RegExp("[a-z]*_txt_[a-z]*").test(f)) {
          data.highlighting[d][f.split("_")[0]] = data.highlighting[d][f];
          delete data.highlighting[d][f];
        }
      });
    });

    // insert dummy pdf for external developement
    if (config.pdf_dummy) {
      data.response.docs = data.response.docs.map((doc) => ({
        ...doc,
        link: config.pdf_dummy,
      }));
    }
    // -----------

    res.status(200).send(data);
    next();
  } catch (err) {
    console.log(err);
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
        UserId: req.UserId,
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
router.get("/suggest", auth, async (req, res, next) => {
  const { q } = req.query;

  try {
    if (!q) return next(new errors.MissingParameterError());
    const { data } = await axios.post(
      solr + "/suggest",
      qs.stringify({q})
    );
    // const data = await solr.post("/suggest", { params: { q } });
    res.send(
      data.suggest.mySuggester[q].suggestions.map((t) =>
        t.term.replace(/<(.|\n)*?>/g, "")
      )
    );
    // res.send(data);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// get search pages hits for document
router.get("/:DocId", auth, async (req, res, next) => {
  const q = req.query.q || "*";
  const DocId = req.params.DocId;

  try {
    // const data = await solr.post("/search", searchPagesBody(q, DocId));
    const { data } = await axios.post(
      solr + "/search",
      qs.stringify(searchPagesBody(q, DocId).params)
    );
    Object.keys(data.highlighting).forEach((d) => {
      Object.keys(data.highlighting[d]).forEach((f) => {
        if (RegExp("p_[0-9]*_page_txt_[a-z]*").test(f)) {
          data.highlighting[d]["page_" + f.split("_")[1]] =
            data.highlighting[d][f];
          delete data.highlighting[d][f];
        }
        if (RegExp("[a-z]*_txt_[a-z]*").test(f)) {
          data.highlighting[d][f.split("_")[0]] = data.highlighting[d][f];
          delete data.highlighting[d][f];
        }
      });
    });

    res.status(200).send(data);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// proxy /select request to SOLR backend
router.post("/select", auth, async (req, res, next) => {
  try {
    const data = await solr.post("/select", { params: req.body });
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
});

// get data for specific document
router.post("/select/:DocId", auth, async (req, res, next) => {
  const { DocId } = req.params;
  try {
    const data = await solr.post("/select", { params: { q: "id:" + DocId } });
    res.send(data);
  } catch (err) {
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
      attributes: ["query", "counter"],
    });
    res.status(200).send(queries);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
