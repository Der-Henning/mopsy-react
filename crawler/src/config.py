from os import environ


CRAWLER_NAME = environ.get("CRAWLER_NAME", "Calibre")
CRAWLER = environ.get("CRAWLER_TYPE", "calibre")
SOLR_HOST = environ.get("MOPSY_SOLR_HOST", "solr")
SOLR_PORT = int(environ.get("MOPSY_SOLR_PORT", "8983"))
SOLR_CORE = environ.get("MOPSY_SOLR_CORE", "mopsy")
SOLR_PREFIX = environ.get("MOPSY_SOLR_PREFIX", "calibre")
DIRECT_COMMIT = environ.get("CRAWLER_DIRECT_COMMIT", "false").lower() in ('true', '1', 't')
AUTORESTART = environ.get("CRAWLER_AUTORESTART", "true").lower() not in ('false', '0', 'f')
AUTOSTART = environ.get("CRAWLER_AUTOSTART", "true").lower() not in ('false', '0', 'f')
SLEEP_TIME = int(environ.get("CRAWLER_SLEEP_TIME", "0"))
CACHE_DIR = environ.get("CACHE_DIRECTORY", "/cache")
