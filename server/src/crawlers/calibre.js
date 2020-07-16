const fs = require("fs");
const path = require("path");
const request = require("request");
const url = require("url");
const config = require("../config");
const md5File = require("md5-file");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const sqlite3 = require("sqlite3").verbose();
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
        if (!error && res.statusCode == 200) {
          resolve(body);
        } else {
          console.log(body);
          reject(error);
        }
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
        if (!error && res.statusCode == 200) {
          resolve(body);
        } else {
          reject(error);
        }
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
        if (!error && res.statusCode == 200) {
          resolve(body);
        } else {
          console.log(body);
          reject(error);
        }
      }
    );
  });
};

const getMeta = (data) => {
  var meta = {};
  for (let i = 0; i < data.length; i = i + 2) {
    meta = { ...meta, [data[i]]: data[i + 1][0] };
  }
  return meta;
};

const index = (document) => {
  return new Promise(async (resolve, reject) => {
    try {
      var md5 = null;
      const check = await solrGetDoc(document.id);
      if (check && check.response && check.response.docs.length > 0) {
        md5 = check.response.docs[0].md5;
      }
      const filename = path.join(
        document.path,
        document.file + "." + document.formats[0]
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
            response[document.file + "." + document.formats[0] + "_metadata"]
          ),
          ...document,
        };

        document.language = document.language.toLowerCase();
        solr_language = document["language"] ? document["language"] : "general";

        var doc = {
          id: "calibre_" + document.id,
          source: "calibre",
          ["title_txt_" + solr_language]: document.title,
          authors: document.authors,
          md5: document.md5,
          formats: document.formats,
          language: document.language,
          tags: document.tags,
          rating: document.rating,
          file: filename,
        };

        const file = response[document.file + "." + document.formats[0]];
        const dom = new JSDOM(file);
        const pages = dom.window.document.querySelectorAll(".page");
        pages.forEach((p, i) => {
          let page = `p_${i + 1}_page_txt_${solr_language}`;
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

const readDB = (calibre_path) => {
  return new Promise(async (resolve, reject) => {
    const getData = (sql) => {
      return new Promise((resolve, reject) => {
        db.all(sql, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };
    const db = new sqlite3.Database(
      calibre_path + "/metadata.db",
      sqlite3.OPEN_READONLY,
      (err) => {
        if (err) reject(err);
        console.log("connected to Calibre Database");
      }
    );
    var documents = [];
    try {
      documents = await getData(
        `SELECT id, title, pubdate, path, isbn FROM books`
      );
      documents = await Promise.all(
        documents.map(async (doc) => {
          [
            authors,
            publishers,
            data,
            tags,
            ratings,
            identifiers,
          ] = await Promise.all([
            getData(
              `SELECT name FROM books_authors_link LEFT JOIN authors ON author=authors.id WHERE book=${doc.id}`
            ),
            getData(
              `SELECT name FROM books_publishers_link LEFT JOIN publishers ON publisher=publishers.id WHERE book=${doc.id}`
            ),
            getData(`SELECT format, name FROM data WHERE book=${doc.id}`),
            getData(
              `SELECT name FROM books_tags_link LEFT JOIN tags ON tag=tags.id WHERE book=${doc.id}`
            ),
            getData(
              `SELECT ratings.rating FROM books_ratings_link LEFT JOIN ratings ON books_ratings_link.rating=ratings.id WHERE book=${doc.id}`
            ),
            getData(`SELECT type, val FROM identifiers WHERE book=${doc.id}`),
          ]);
          return {
            ...doc,
            authors: authors.map((a) => a.name),
            publishers: publishers.map((p) => p.name),
            formats: data.map((d) => d.format),
            tags: tags.map((t) => t.name),
            file: data.map((d) => d.name)[0],
            rating: ratings.map((r) => r.rating)[0],
            identifiers: identifiers.map((i) => ({ type: i.type, val: i.val })),
            path: path.join(calibre_path, doc.path),
          };
        })
      );
    } catch (err) {
      reject(err);
    }
    db.close();
    resolve(documents);
  });
};

const start = async (postData) => {
  stopped = false;

  postData({
    message: "started Calibre crawler",
    progress: 0,
    timeleft: undefined,
  });

  const calibre_path = process.env.CALIBRE_SOLR_CALIBRE_LIBRARY;
  const documents = await readDB(calibre_path);

  for (let i = 0; i < documents.length; i++) {
    if (stopped) {
      postData({
        message: "stopped by user",
        progress: i / documents.length,
        timeleft: undefined,
      });
      return;
    }
    postData({
      message: documents[i].title,
      progress: i / documents.length,
      timeleft: undefined,
    });
    console.log(documents[i].title);
    try {
      if (documents[i].formats) await index(documents[i]);
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
