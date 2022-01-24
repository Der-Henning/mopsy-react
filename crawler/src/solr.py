import sys
import logging as log
import time
import requests


class Solr:
    def __init__(self, host, port, core):
        self._host = host
        self._port = port
        self._core = core

    def _build_url(self, handler):
        return f"http://{self._host}:{self._port}/solr/{self._core}{handler}"

    def wait_for_connection(self):
        while True:
            try:
                solr_status = self.ping()
                if solr_status["status"] != "OK":
                    raise Exception("Solr not ready")
            except:
                log.error(sys.exc_info())
                log.warning("Waiting for SOLR to start up")
                time.sleep(10)
            else:
                break

    def ping(self):
        url = self._build_url("/admin/ping")
        res = requests.get(url, params={"wt": "json"})
        return res.json()

    def select(self, params=None):
        url = self._build_url("/select")
        self.wait_for_connection()
        res = requests.get(url, params=params)
        return res.json()

    def commit(self, doc, params=None):
        params = {"commit": "true"} if params is None else params
        url = self._build_url("/update/json/docs")
        self.wait_for_connection()
        res = requests.post(url, json=doc, params=params)
        return res.json()

    def extract(self, file, params=None):
        params = {"extractOnly": "true"} if params is None else params
        url = self._build_url("/update/extract")
        files = {'file': open(file, 'rb')}
        self.wait_for_connection()
        res = requests.post(url, files=files, params=params)
        return res.json()

    def build_dict(self, params=None):
        params = {"suggest.build": "true"} if params is None else params
        url = self._build_url("/suggest")
        self.wait_for_connection()
        res = requests.get(url, params=params)
        return res.json()

    def remove(self, doc_id):
        url = self._build_url("/update")
        self.wait_for_connection()
        res = requests.post(url, json={"commit": {}, "delete": {"id": doc_id}})
        return res.json()

    def remove_all(self, source):
        url = self._build_url("/update")
        self.wait_for_connection()
        res = requests.post(url, json={"commit": {}, "delete": {
                            "query": f"source:{source}"}})
        return res.json()

    def optimize(self):
        url = self._build_url("/update")
        params = {"optimize": "true"}
        self.wait_for_connection()
        res = requests.get(url, params=params)
        return res.json()

    def is_lang_supported(self, lang):
        url = self._build_url("/schema/fields")
        self.wait_for_connection()
        res = requests.get(url).json()
        return any(x["name"] == f"content_txt_{lang}" for x in res["fields"])
