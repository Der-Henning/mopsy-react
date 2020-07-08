#!/usr/bin/env bash

docker-compose rm -f -v
docker volume rm mopsyreact_solr_data mopsyreact_mysql_data mopsyreact_solr_configset
docker-compose build --force-rm --no-cache
docker rmi $(docker images -f dangling=true -q)