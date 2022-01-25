#!/bin/sh
#
# docker-entrypoint for mopsy

set -e

nginx

exec "$@"