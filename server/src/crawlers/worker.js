const fs = require("fs");
const path = require("path");
const request = require("request");
const url = require("url");
const config = require("../config");
const md5File = require("md5-file");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const axios = require("axios");

const solr = url.format({
  protocol: "http",
  hostname: config.solr.host,
  port: config.solr.port,
  pathname: "solr/" + config.solr.core,
});

var stopped = false;

const solrExtractData = (file) => {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: solr + "/update/extract?extractOnly=true",
        formData: {
          files: [fs.createReadStream(file)],
        },
        json: true,
      },
      (error, res, body) => {
        if (error) reject(error);
        if (res.statusCode == 200) resolve(body);
        reject(body);
      }
    );
  });
};

const solrPostData = (data) => {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: solr + "/update/json/docs?commit=true",
        body: data,
        json: true,
      },
      (error, res, body) => {
        if (error) reject(error);
        if (res.statusCode == 200) resolve(body);
        reject(body);
      }
    );
  });
};

const solrGetDoc = (docId) => {
  return new Promise((resolve, reject) => {
    request.get(
      {
        url: solr + "/select?fl=id,md5&q=id:" + docId,
        json: true,
      },
      (error, res, body) => {
        if (error) reject(error);
        if (res.statusCode == 200) resolve(body);
        reject(body);
      }
    );
  });
};

const getMeta = (data) => {
  var meta = {};
  if (data) {
    for (let i = 0; i < data.length; i = i + 2) {
      meta = { ...meta, [data[i]]: data[i + 1][0] };
    }
  }
  return meta;
};

const index = (document, source) => {
  return new Promise(async (resolve, reject) => {
    try {
      var md5 = null;
      const check = await solrGetDoc(document.id);
      if (check && check.response && check.response.docs.length > 0) {
        md5 = check.response.docs[0].md5;
      }
      document.format = document.formats[0].toLowerCase();
      const filename = path.join(
        document.path,
        document.file + "." + document.format
      );
      document = {
        ...document,
        md5: await md5File(filename),
      };
      if (md5 != document["md5"]) {
        console.log("new Doc");
        const response = await solrExtractData(filename);

        document = {
          ...getMeta(
            response[document.file + "." + document.format + "_metadata"]
          ),
          ...document,
        };

        var doc = {
          id: "calibre_" + document.id,
          source: source,
          ["title_txt_" + document.language]: document.title,
          authors: document.authors,
          md5: document.md5,
          formats: document.formats,
          language: document.language,
          tags: document.tags,
          rating: document.rating,
          file: filename,
        };

        const file = response[document.file + "." + document.format];
        const dom = new JSDOM(file);
        const pages = dom.window.document.querySelectorAll(".page");
        pages.forEach((p, i) => {
          let page = `p_${i + 1}_page_txt_${document.language}`;
          doc[page] = p.textContent;
        });
        await solrPostData(doc);
        console.log("commited document");
      } else console.log("no changes");
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const start = async (_arguments) => {
  const { name, postData, module, args } = _arguments;
  const { crawler, async } = require("./" + module);

  stopped = false;
  postData({
    message: "started",
    progress: 0,
    timeleft: undefined,
  });
  const documents = async
    ? await crawler(JSON.parse(args))
    : crawler(JSON.parse(args));
  for (let i = 0; i < documents.length; i++) {
    if (stopped) {
      postData({
        message: "stopped by user",
        progress: i / documents.length,
        timeleft: undefined,
      });
      break;
    }
    postData({
      message: documents[i].title,
      progress: i / documents.length,
      timeleft: undefined,
    });
    try {
      if (documents[i].formats) await index(documents[i], name);
    } catch (err) {
      console.log(err);
    }
  }

  postData({
    message: "building dictionary ...",
    progress: 1,
    timeleft: 0,
  });

  await axios.get(solr + "/suggest?suggest.build=true");

  postData({
    message: "finished",
    progress: 1,
    timeleft: 0,
  });
};

const stop = () => {
  stopped = true;
};

module.exports = { start, stop };
