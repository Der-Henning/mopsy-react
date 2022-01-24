import os
import logging as log
import flask
from flask import jsonify
from crawler import Crawler

LOGLEVEL = log.DEBUG if os.getenv("DEBUG") == "true" else log.INFO
PORT = int(os.getenv("CRAWLER_PORT", 80))

log.basicConfig(
    level=LOGLEVEL, format='%(levelname)s - %(name)s - %(message)s',)

server = flask.Flask("api")
server.config["DEBUG"] = False

crawler = Crawler()


@server.route("/", methods=['GET'])
def status():
    return jsonify(crawler.status)


@server.route("/start", methods=['POST'])
def start():
    return jsonify(crawler.start())


@server.route("/stop", methods=['POST'])
def stop():
    return jsonify(crawler.stop())


@server.route("/toggleAutorestart", methods=["POST"])
def toggle_autorestart():
    return jsonify(crawler.toggle_autorestart())


@server.route("/fieldList", methods=["GET"])
def field_list():
    return jsonify(crawler.documents.field_list)


def start_server():
    server.run(host='0.0.0.0', port=PORT)


if __name__ == "__main__":
    start_server()
