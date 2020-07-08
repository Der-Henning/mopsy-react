const fs = require("fs");
const path = require("path");
const request = require("request");
const url = require("url");
const config = require("../config");
const md5File = require("md5-file");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const sqlite3 = require("sqlite3").verbose();

const solr = url.format({
  protocol: "http",
  hostname: config.solr.host,
  port: config.solr.port,
  pathname: "solr/" + config.solr.core,
});

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

const index = async (document) => {
  try {
    var md5 = null;
    const check = await solrGetDoc(document.id);
    if (check && check.response && check.response.docs.length > 0) {
      md5 = check.response.docs[0].md5;
    }

    document = {
      ...document,
      md5: await md5File(document.path),
    };
    if (md5 != document["md5"]) {
      console.log("new Doc");
      const response = await solrExtractData(document.path);

      document = {
        ...getMeta(
          response[
            document.name + "." + document.format.toLowerCase() + "_metadata"
          ]
        ),
        ...document,
      };

      document.language = document.language.toLowerCase();

      var doc = {
        id: document.id,
        source: "calibre",
        ["title_txt_" + document.language]: document.title,
        authors: document.authors,
        md5: document.md5,
        format: document.format,
        language: document.language
      };
      console.log(doc);

      const file =
        response[document.name + "." + document.format.toLowerCase()];
      const dom = new JSDOM(file);
      const pages = dom.window.document.querySelectorAll(".page");
      pages.forEach((p, i) => {
        let page = "p_" + (i + 1) + "_page_txt_" + (document["language"] ? document["language"] : "general")
        doc[page] = p.textContent;
      });
      await solrPostData(doc);
      console.log("commited");
    } else console.log("no changes");
  } catch (err) {
    console.log(err);
  }
};

module.exports = async (postData) => {
  postData({
    message: "started Calibre crawler",
    progress: 0,
    timeleft: undefined,
  });

  const calibre_path = process.env.CALIBRE_SOLE_CALIBRE_LIBRARY;

  let db = new sqlite3.Database(
    calibre_path + "/metadata.db",
    sqlite3.OPEN_READONLY,
    (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Connected to the calibre database.");
    }
  );

  var documents = [];

  db.serialize(() => {
    db.all(
      `SELECT books.id, title, format, name, path, isbn, pubdate, 
      (SELECT name FROM books_authors_link AS bal JOIN authors ON(author = authors.id) WHERE book = books.id) authors,
      (SELECT name FROM publishers WHERE publishers.id IN (SELECT publisher from books_publishers_link WHERE book=books.id)) publishers,
      (SELECT rating FROM ratings WHERE ratings.id IN (SELECT rating from books_ratings_link WHERE book=books.id)) rating,
      (SELECT name FROM tags WHERE tags.id IN (SELECT tag from books_tags_link WHERE book=books.id)) tags
      FROM books 
      LEFT JOIN data ON books.id=data.book`,
      [],
      (err, rows) => {
        if (err) {
          console.error(err.message);
        }
        documents = rows.map((row) => ({
          ...row,
          id: "calibre_" + row.id,
          path: path.join(
            calibre_path,
            row.path,
            row.name + "." + row.format.toLowerCase()
          ),
        }));
      }
    );
  });

  db.close(async (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Close the database connection.");

    for (let i = 0; i < documents.length; i++) {
      var document = documents[i];
      postData({
        message: document.name,
        progress: i / documents.length,
        timeleft: undefined,
      });
      console.log(document.title);
      await index(document);
    }

    postData({
      message: "finished Calibre crawler",
      progress: 1,
      timeleft: 0,
    });
  });
};
