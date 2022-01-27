"use strict";

const config = require("../config");
const url = require("url");
const axios = require("axios");
const errors = require("./errors");

// build solr url for SOLR backend requests
const solr = url.format({
  protocol: "http",
  hostname: config.solr.host,
  port: config.solr.port,
  pathname: "solr/" + config.solr.core,
});

// default fields returned for each document
const fieldList = "id,document,title_txt_*,subtitle_txt_*,tags_txt_*,summary_txt_*,authors,score,path,language,cache,file,link,externallink,scanDate,creationDate,modificationDate,publicationDate,rating,source";

const facetFields = async () => {
  var facet = {
    Keywords: {
      type: "terms",
      field: "Keywords_facet"
    },
    Authors: {
      type: "terms",
      field: "Authors_facet"
    },
    Publishers: {
      type: "terms",
      field: "Publishers_facet"
    },
    Language: {
      type: "terms",
      field: "language"
    },
    Creation: {
      type: "terms",
      field: "creationDate",
      // gap: "+1DAY",
      // end: "NOW",
      // start: "NOW/MONTH"
      // TZ: "America/Los_Angeles",
    }
  }

  await Promise.all(config.crawlers.map(async crawler => {
    try {
      const c = await axios.get(`http://${crawler}/fieldList`)
      facet = { ...facet, ...c.data.facets }
    } catch (err) {
      console.log(err);
    }
  }))

  return facet
}

const map_fields = (res) => {
  res.response.docs.map(doc =>
    Object.keys(doc).map((key) => {
      const newKey = key.replace(/_txt_.*/, '');
      if (newKey != key) {
        doc[newKey] = doc[key];
        delete doc[key];
      }
    })
  )
  if (res.highlighting) {
    Object.keys(res.highlighting).forEach((doc) => {
      res.highlighting[doc]["pages"] = [];
      // var pagesArr = [];
      Object.keys(res.highlighting[doc]).map((key) => {
        if (RegExp("p_[0-9]+_page_txt_.*").test(key)) {
          // res.highlighting[doc]["pages"][parseInt(key.split("_")[1])] = res.highlighting[doc][key];
          res.highlighting[doc]["pages"].push([parseInt(key.split("_")[1]), res.highlighting[doc][key]]);
          delete res.highlighting[doc][key];
        } else {
          const newKey = key.replace(/_txt_.*/, '');
          if (newKey != key) {
            res.highlighting[doc][newKey] = res.highlighting[doc][key];
            delete res.highlighting[doc][key];
          }
        }
      })
      
      res.highlighting[doc]["pages"].sort((a, b) => b[1].length - a[1].length);
      
      // res.highlighting[doc]["pages"] = Object.assign({}, ...pagesArr.map((p) => ({[p[0]]: p[1]})));
      // console.log(res.highlighting[doc]["pages"])
    })
  }
  return res;
}

const post = (requestHandler, body) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.post(
        solr + requestHandler, body
      );
      if (data?.responseHeader && data.responseHeader.status == 0)
        resolve(data);
      reject(new errors.SolrBackendError());
    } catch (err) {
      reject(err);
    }
  });
};

const get = (requestHandler) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.get(solr + requestHandler);
      if (data?.responseHeader && data.responseHeader.status == 0)
        resolve(data);
      reject(new errors.SolrBackendError());
    } catch (err) {
      reject(err);
    }
  });
};

const select_docs = async (query, {
  fields, sort, limit, offset, filter, params, facet
} = {
    fields: fieldList,
    sort: undefined,
    limit: undefined,
    offset: undefined,
    filter: undefined,
    params: undefined,
    facet: undefined
  }) => {
  if (!fields) fields = fieldList;
  var res = await post("/select", { query, fields, sort, limit, offset, filter, params, facet });
  return map_fields(res)
}

const select_doc = (docId, { fields } = { fields: fieldList }) => {
  return select_docs(`id:"${docId}"`, { fields });
}

const search = async (query, page, filter) => {
  var res = await post("/search",
    {
      query,
      fields: fieldList,
      limit: 10,
      offset: (page - 1) * 10,
      filter,
      facet: await facetFields(),
      params: {
        hl: "on",
        "hl.snippets": 1,
        "hl.fl": "document,title_*,subtitle_*,tags_*,authors",
        "hl.fragsize": 0,
        "hl.encoder": "html"
      }
    });
  return map_fields(res)
}

const search_pages = async (query, docId) => {
  var res = await post("/search",
    {
      query,
      limit: 1,
      fields: "id",
      filter: [`id:"${docId}"`],
      params: {
        hl: "on",
        "hl.fl": "*_page_*",
        "hl.snippets": 10,
        "hl.encoder": "html"
      }
    });
  return map_fields(res)
}

const suggest = (query) => {
  return post("/suggest", { query });
}

module.exports = { post, get, select_doc, select_docs, search, search_pages, facetFields, suggest };
