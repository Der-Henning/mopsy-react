import os
import sys
from os import path
from multiprocessing import Process, Manager
from ctypes import c_wchar_p, c_bool, c_double
from threading import Thread
import hashlib
import time
import datetime
import logging as log
from bs4 import BeautifulSoup
from fileCache import FileCache
from buildSchema import langs
from langdetect import detect
import config
from solr import Solr

FIELD_LIST = "id,md5,source,rating,publishers,document,authors,publicationDate,language,title_txt_*,subtitle_txt_*,tags_txt_*,summary_txt_*,creationDate,modificationDate"


class Crawler:
    def __init__(self):
        log.debug("Initializing Crawler ...")
        manager = Manager()
        self.proc_status = manager.Value(c_wchar_p, "idle")
        self.proc_progress = manager.Value(c_double, 0.0)
        self.proc_text = manager.Value(c_wchar_p, "")
        self.proc_stop = manager.Value(c_bool, False)
        self.proc_startable = manager.Value(c_bool, True)
        self.proc_autorestart = manager.Value(c_bool, config.AUTORESTART)
        self.autostart = config.AUTOSTART
        self.task = None
        self.file_cache = FileCache()
        self.indexed_ids = []

        sys.path.insert(0, path.join(path.dirname(
            path.abspath(__file__)), "sources"))
        self.documents = __import__(config.CRAWLER).Documents

        self.solr = Solr(config.SOLR_HOST, config.SOLR_PORT, config.SOLR_CORE)

        self.thread = Thread(target=self.whatchman)
        self.thread.start()

        if self.autostart:
            log.info("Autostarting Crawler ...")
            self.start()

    def whatchman(self):
        while True:
            time.sleep(10)
            if self.proc_autorestart.get() and self.proc_startable.get() and not self.proc_stop.get():
                log.info("Restarting Crawler ...")
                self.start()

    def start(self):
        if self.proc_startable.get():
            self.indexed_ids = []
            self.proc_progress.set(0)
            self.proc_status.set("starting")
            self.proc_text.set("")
            self.proc_stop.set(False)
            self.proc_startable.set(False)
            self.task = Process(target=self.worker, args=(
                self.proc_stop, self.proc_text, self.proc_progress, self.proc_status, self.proc_startable))
            self.task.start()
        return self.status

    def stop(self):
        if not self.proc_startable.get():
            self.proc_stop.set(True)
            self.proc_status.set("stopping")
        return self.status

    def toggle_autorestart(self):
        self.proc_autorestart.set(not self.proc_autorestart.get())
        return self.status

    @property
    def status(self):
        return {
            "name": config.CRAWLER_NAME,
            "status": self.proc_status.get(),
            "progress": self.proc_progress.get(),
            "text": self.proc_text.get(),
            "startable": self.proc_startable.get(),
            "autorestart": self.proc_autorestart.get(),
            "indexed_docs": self.num_docs
        }

    @property
    def num_docs(self):
        res = self.solr.select({
            "q": f"source:{config.SOLR_PREFIX}",
            "fl": "id"
        })
        return res["response"]["numFound"]

    def delete_all_docs(self):
        self.solr.remove_all(config.SOLR_PREFIX)
        self.solr.optimize()
        self.file_cache.remove_all()
        return self.status

    def worker(self, stopped, text, progress, status, startable):
        try:
            status.set("reading database")
            documents = self.documents()
            status.set("indexing")
            for idx, doc in enumerate(documents):
                if stopped.get():
                    break
                try:
                    progress.set(round(idx / len(documents) * 100, 2))
                    if "title" in doc:
                        text.set(doc["title"])
                        log.info(doc["title"])
                    if config.DIRECT_COMMIT:
                        self.solr.commit(doc)
                    else:
                        self.indexer(doc)
                except:
                    log.error(sys.exc_info())
                finally:
                    self.indexed_ids.append(doc["id"])
                    time.sleep(config.SLEEP_TIME)

            if not stopped.get():
                progress.set(100)
                status.set("cleaning")
                self.cleanup()

            status.set("building suggestions")
            text.set("")
            self.solr.build_dict()

            status.set("optimizing")
            self.solr.optimize()

            if stopped.get():
                status.set("canceled")
            else:
                status.set("done")
        except:
            status.set(f"error: {sys.exc_info()}")
            log.error(sys.exc_info())
        finally:
            startable.set(True)

    def cleanup(self):
        num_found = 100
        offset = 0
        rows = 100
        while offset < num_found:
            try:
                res = self.solr.select({
                    "q": f'id:"{config.SOLR_PREFIX}_*"',
                    "fl": FIELD_LIST,
                    "fq": "deleted:false",
                    "rows": rows,
                    "start": offset
                })
                solr_docs = res["response"]["docs"]
                for solr_doc in solr_docs:
                    if not solr_doc["id"] in self.indexed_ids:
                        log.info("mark %s as deleted", solr_doc['id'])
                        doc = solr_doc
                        doc["deleted"] = True
                        doc["md5"] = ""
                        doc["scanDate"] = datetime.datetime.now().isoformat() + "Z"
                        self.solr.commit(doc)
                        self.file_cache.remove(solr_doc["id"])
                num_found = res["response"]["numFound"]
            except:
                log.error(sys.exc_info())
            finally:
                offset += rows

    def indexer(self, doc):
        def tomd5(fname):
            hash_md5 = hashlib.md5()
            with open(fname, "rb") as file:
                for chunk in iter(lambda: file.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()

        # get existing doc from solr
        solr_doc = self.solr.select(
            {"q": f'id:"{doc["id"]}"', "fl": FIELD_LIST})

        # read md5 if exists
        md5 = ""
        if len(solr_doc["response"]["docs"]) > 0 and "md5" in solr_doc["response"]["docs"][0]:
            md5 = solr_doc["response"]["docs"][0]["md5"]

        # get file
        if "indexlink" in doc:
            cache = self.file_cache.download(doc["indexlink"], doc["id"])
            doc.pop("indexlink", None)
            doc["cache"] = cache
        elif "file" in doc:
            # file_path = doc["file"]
            cache = self.file_cache.symlink(doc["file"], doc["id"])
            doc["cache"] = cache
        elif "link" in doc:
            cache = self.file_cache.download(doc["link"], doc["id"])
            doc["cache"] = cache
        # else: return

        # if no file provided delete cached file
        # if exists in solr -> mark as deleted else stop
        if doc["cache"] is None or not os.path.exists(doc["cache"]):
            log.info("No file found")
            self.file_cache.remove(doc["id"])
            if len(solr_doc["response"]["docs"]) > 0:
                doc["deleted"] = True
                doc.update(solr_doc["response"]["docs"][0])
                doc["md5"] = ""
            else:
                return

        # read file and compare md5
        # if md5 matches saved one -> stop
        # else extract data from file
        else:
            doc["md5"] = tomd5(doc["cache"])
            log.info(doc["md5"])
            if md5 != doc["md5"]:
                log.info("new Document")
                extract = self.extract_data(doc["cache"])
                if not extract:
                    log.info("Error extracting data from file")
                    return
                if not "title" in doc:
                    doc["title"] = extract["title"]
                if "language" in extract and not "language" in doc:
                    doc['language'] = extract['language']
                if "creationDate" in extract:
                    doc["creationDate"] = extract["creationDate"]
                if "modificationDate" in extract:
                    doc["modificationDate"] = extract["modificationDate"]
                doc["pages"] = extract['pages']
                doc["deleted"] = False
            else:
                log.info("no changes")
                return

        # set document language for fields
        if not "language" in doc:
            doc["language"] = "other"
        if not doc['language'] in langs:
            doc['language'] = "other"
        if doc['language'] == "other" and "pages" in doc:
            doc['language'] = self.detect_lang(doc["pages"])
        if "title" in doc:
            doc[f"title_txt_{doc['language']}"] = doc["title"]
            doc.pop("title", None)
        if "tags" in doc:
            doc[f"tags_txt_{doc['language']}"] = doc["tags"]
            doc.pop("tags", None)
        if "subtitle" in doc:
            doc[f"subtitle_txt_{doc['language']}"] = doc["subtitle"]
            doc.pop("subtitle", None)
        if "summary" in doc:
            doc[f"summary_txt_{doc['language']}"] = doc["summary"]
            doc.pop("summary", None)
        if "pages" in doc:
            doc.update({f"p_{num}_page_txt_{doc['language']}": page for num, page in enumerate(
                doc['pages'], start=1)})
            doc.pop("pages", None)
        doc["scanDate"] = datetime.datetime.now().isoformat() + "Z"
        doc["source"] = config.SOLR_PREFIX

        # commit document to solr
        self.solr.commit(doc)

    def extract_data(self, file_path):
        def get_pages(html):
            soup = BeautifulSoup(html, 'html.parser')
            pages = [s.get_text() for s in soup.find_all("div", "page")]
            return pages
        data = {}
        try:
            extract = self.solr.extract(file_path)
            filename = os.path.basename(file_path)
            content = extract["file"] if "file" in extract else extract[filename]
            meta = extract["file_metadata"] if "file_metadata" in extract else extract[
                f"{filename}_metadata"]
            meta = dict(zip(meta[::2], meta[1::2]))
            data['title'] = meta['dc:title'][0] if 'dc:title' in meta and meta['dc:title'][0] != '' else filename
            data['pages'] = get_pages(content)
            if "created" in meta:
                data['creationDate'] = meta['created'][0]
            if "Last-Modified" in meta:
                data['modificationDate'] = meta['Last-Modified'][0]
            if "language" in meta:
                data['language'] = meta['language'][0].lower()
        except:
            log.error(sys.exc_info())
        return data

    def detect_lang(self, pages):
        try:
            lang_list = [detect(page) for page in pages]
            counter = {}
            for lang in lang_list:
                if lang in counter:
                    counter[lang] += 1
                else:
                    counter[lang] = 1
            sorted_counter = sorted(langs, key=counter.get, reverse=True)
            return sorted_counter[0]
        except:
            log.error(sys.exc_info())
            return "other"
