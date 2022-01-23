import sqlite3
import os
import config


class Documents:
    def __init__(self):
        self._documents = []
        self._index = 0
        self._prefix = config.SOLR_PREFIX
        calibre_path = os.getenv("CALIBRE_PATH", "/mnt/books")
        self._documents = self._read_calibre_db(calibre_path)

    # define individual facets for this crawler
    field_list = {
        "facets": {}
    }

    def __iter__(self):
        return self

    def __len__(self):
        return len(self._documents)

    def __next__(self):
        if self._index < len(self._documents):
            doc = self._documents[self._index]
            self._index += 1
            return doc
        raise StopIteration

    def _read_calibre_db(self, calibre_path):
        def dict_factory(cursor, row):
            dic = {}
            for idx, col in enumerate(cursor.description):
                dic[col[0]] = row[idx]
            return dic

        with sqlite3.connect(os.path.join(calibre_path, "metadata.db")) as conn:
            conn.row_factory = dict_factory
            cur = conn.cursor()
            cur.execute("SELECT id, title, pubdate, path, isbn FROM books")
            books = cur.fetchall()
            documents = []
            for book in books:
                doc = {}
                rows = cur.execute(
                    f"SELECT format, name FROM data WHERE book={book['id']}").fetchall()
                for row in rows:
                    if row["format"] == "PDF":
                        doc["id"] = f"{self._prefix}_{str(book['id'])}"
                        doc["title"] = book["title"]
                        doc["file"] = os.path.join(
                            calibre_path, book["path"], row["name"] + ".pdf")
                        doc["authors"] = [a['name'] for a in cur.execute(
                            f"SELECT name FROM books_authors_link LEFT JOIN authors ON author=authors.id WHERE book={book['id']}").fetchall()]
                        doc["publishers"] = [p['name'] for p in cur.execute(
                            f"SELECT name FROM books_publishers_link LEFT JOIN publishers ON publisher=publishers.id WHERE book={book['id']}").fetchall()]
                        doc["tags"] = [t["name"] for t in cur.execute(
                            f"SELECT name FROM books_tags_link LEFT JOIN tags ON tag=tags.id WHERE book={book['id']}").fetchall()]
                        ratings = [r["rating"] for r in cur.execute(
                            f"SELECT ratings.rating FROM books_ratings_link LEFT JOIN ratings ON books_ratings_link.rating=ratings.id WHERE book={book['id']}").fetchall()]
                        doc["rating"] = ratings[0] if len(ratings) > 0 else 0
                        doc["publicationDate"] = book["pubdate"]
                        documents.append(doc)
            return documents
