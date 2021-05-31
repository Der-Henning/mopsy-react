const router = require("express").Router();
const config = require("../../../config");
const models = require("../../../models");
const auth = require("../../../middleware/auth");
const errors = require("../../../middleware/errors");
const solr = require("../../../middleware/solr");

const apiVersion = "v1";

const searchBody = (q, page, fq) => {
  return {
    ...config.solr.searchParams,
    q,
    rows: 10,
    start: (page - 1) * 10,
    fq,
    hl: "on",
    "hl.snippets": 1,
    "hl.fl": "document,title_*,subtitle_*,tags_*,authors",
    "hl.fragsize": 0,
    facet: "off",
  };
};

const searchPagesBody = (q, DocId) => {
  return {
    ...config.solr.searchParams,
    q,
    rows: 1,
    fl: "id",
    fq: "id:" + DocId,
    hl: "on",
    "hl.fl": "*_page_*",
    "hl.snippets": 10,
    facet: "off",
  };
};

const selectPage = (DocId, Page) => {
  return {
    q: `id:${DocId}`,
    fl: `p_${Page}_page_*`,
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
    const data = await solr.post("/search", searchBody(q, page, fq));
    data.response.docs = data.response.docs.map((doc) => ({
        id: doc.id,
        document: doc.document,
        title: doc["title_txt_" + doc.language],
        subtitle: doc["subtitle_txt_" + doc.language],
        authors: doc.authors,
        language: doc.language,
        creationDate: doc.creationDate,
        scanDate: doc.scanDate,
        publicationDate: doc.publicationDate,
        modificationDate: doc.modificationDate,
        data: doc.data,
        path: doc.path,
        // link: doc.link || `/api/${apiVersion}/pdf/${doc.id}`,
        link: `/api/${apiVersion}/pdf/${doc.id}`,
    }));
    if (req.LoginId) {
      data.response.docs = await Promise.all(
        data.response.docs.map(async (doc) => ({
          ...doc,
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
    const data = await solr.post("/suggest", { q });
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
router.get("/:DocId", auth, async (req, res, next) => {
  const q = req.query.q || "*";
  const DocId = req.params.DocId;

  try {
    const data = await solr.post("/search", searchPagesBody(q, DocId));
    Object.keys(data.highlighting).forEach((d) => {
      data.highlighting[d]["pages"] = {};
      Object.keys(data.highlighting[d]).forEach((f) => {
        if (RegExp("p_[0-9]*_page_txt_[a-z]*").test(f)) {
          data.highlighting[d]["page_" + f.split("_")[1]] =
            data.highlighting[d][f];
          data.highlighting[d]["pages"][parseInt(f.split("_")[1])] = data.highlighting[d][f];
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
    next(err);
  }
});

// get page of document
router.get("/:DocId/:page", auth, async (req, res, next) => {
  const { DocId, page } = req.params;
  try {
    const data = await solr.post("/select", selectPage(DocId, page));
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
router.post("/select", auth, async (req, res, next) => {
  try {
    const data = await solr.post("/select", req.body);
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
});

// get data for specific document
router.post("/select/:DocId", auth, async (req, res, next) => {
  const { DocId } = req.params;
  try {
    const data = await solr.post("/select", { q: "id:" + DocId });
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
