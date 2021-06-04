"use strict";

const config = require("../config");
const url = require("url");
const axios = require("axios");
const qs = require("qs");
const errors = require("./errors");

// build solr url for SOLR backend requests
const solr = url.format({
  protocol: "http",
  hostname: config.solr.host,
  port: config.solr.port,
  pathname: "solr/" + config.solr.core,
});

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

module.exports = { post, get };
