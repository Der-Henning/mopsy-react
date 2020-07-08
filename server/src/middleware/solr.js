"use strict";

const config = require("../config");
const request = require("request");
const url = require("url");
const errors = require("../middleware/errors");
const axios = require("axios");

// build solr url for SOLR backend requests
const solr = url.format({
  protocol: "http",
  hostname: config.solr.host,
  port: config.solr.port,
  pathname: "solr/" + config.solr.core,
});

const post = async (uri, body) => {
  const response = await axios.post(solr + uri, {
    data: body
  })
  
}

// promise based request
// const post = (uri, body) => {
//   console.log(body);
//   return new Promise((resolve, reject) => {
//     request.post(
//       {
//         url: solr + uri,
//         body: body,
//         json: true,
//       },
//       (error, res, body) => {
//         console.log(body);
//         if (!error && res.statusCode == 200) {
//           if (body?.responseHeader?.status == 0) {
//             resolve(body);
//           } else reject(new errors.SolrBackendError());
//         } else {
//           if (error) reject(error);
//           else reject(new errors.SolrBackendError());
//         }
//       }
//     );
//   });
// };

module.exports = {
  post,
};
