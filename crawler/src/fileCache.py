import os
from os import path
import requests
import config


class FileCache:
    def __init__(self):
        self.cache_folder = path.join(config.CACHE_DIR, config.SOLR_PREFIX)
        if not path.exists(self.cache_folder):
            os.makedirs(self.cache_folder)

    def download(self, link, doc_id):
        req = requests.get(link, allow_redirects=True)
        req.raise_for_status()
        file_path = path.join(self.cache_folder, f"{doc_id}.pdf")
        with open(file_path, 'wb').write(req.content):
            return file_path

    def remove(self, doc_id):
        file_path = path.join(self.cache_folder, f"{doc_id}.pdf")
        if path.exists(file_path):
            os.remove(file_path)
