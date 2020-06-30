"use strict";

const config = require("../config");
const request = require("request");
const url = require("url");
const errors = require("../middleware/errors");

// build solr url for SOLR backend requests
const solr = url.format({
  protocol: "http",
  hostname: config.solr.host,
  port: config.solr.port,
  pathname: "solr/" + config.solr.core,
});

// promise based request
const post = (uri, body) => {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: solr + uri,
        body: body,
        json: true,
      },
      (error, res, body) => {
        if (!error && res.statusCode == 200) {
          if (
            body?.responseHeader?.status == 0
          ) {
            resolve(body);
          } else reject(new errors.SolrBackendError());
        } else {
          reject(error);
        }
      }
    );
  });
};

module.exports = {
  post,
};
