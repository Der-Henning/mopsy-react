const sqlite3 = require("sqlite3").verbose();
const langs = require("langs");
const path = require("path");

const name = "Calibre";
const version = "1.0";
const async = true;

const crawler = async (args) => {
  const { calibre_path } = args;

console.log( calibre_path);

  const db = new sqlite3.Database(
    calibre_path + "/metadata.db",
    sqlite3.OPEN_READONLY,
    (err) => {
      if (err) reject(err);
      console.log("connected to Calibre Database");
    }
  );

  const getData = (sql) => {
    return new Promise((resolve, reject) => {
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

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
          languages,
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
          getData(
            `SELECT languages.lang_code FROM books_languages_link LEFT JOIN languages ON books_languages_link.lang_code=languages.id WHERE book=${doc.id}`
          ),
        ]);
        const language = languages ? langs.where("2", languages.map(l => l.lang_code)[0]) : undefined;
        return {
          ...doc,
          authors: authors.map((a) => a.name),
          publishers: publishers.map((p) => p.name),
          formats: data.map((d) => d.format),
          tags: tags.map((t) => t.name),
          file: data ? data.map((d) => d.name)[0] : null,
          rating: ratings ? ratings.map((r) => r.rating)[0] : null,
          identifiers: identifiers.map((i) => ({ type: i.type, val: i.val })),
          path: path.join(calibre_path, doc.path),
          language: language ? language["1"] : "other",
        };
      })
    );
  } catch (err) {
    console.log(err);
  } finally {
    db.close();
    return documents;
  }
};

module.exports = { name, version, async, crawler };
