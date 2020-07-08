#!/usr/bin/env bash
set -e

echo "Executing $0" "$@"

CORE=${1:-}
CONFIG_SOURCE="${2:-}"

if [ -d /var/solr/data/${CORE}/conf ]; then
    cp ${CONFIG_SOURCE}/conf/* /var/solr/data/${CORE}/conf
fi