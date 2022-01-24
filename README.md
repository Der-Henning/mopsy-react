![Node.js CI](https://github.com/Der-Henning/mopsy-react/workflows/Node.js%20CI/badge.svg?branch=master)
[![Publish multi-arch Docker images](https://github.com/Der-Henning/mopsy-react/actions/workflows/docker-multi-arch.yml/badge.svg)](https://github.com/Der-Henning/mopsy-react/actions/workflows/docker-multi-arch.yml)
[![CodeQL](https://github.com/Der-Henning/mopsy-react/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/Der-Henning/mopsy-react/actions/workflows/codeql-analysis.yml)
[![GitHub release](https://img.shields.io/github/release/Der-Henning/mopsy-react?include_prereleases=&sort=semver&color=blue)](https://github.com/Der-Henning/mopsy-react/releases/)

# MOPSY Search

MOPSY Search is a fast full-text search tool with a focus on simplicity and finding information quickly on large volumes of technical documents and regulations. 

## Demo

For a live Demo visit [https://mopsy.merklinger.selfhost.co](https://mopsy.merklinger.selfhost.co/). The Database contains some open access computer science books.

## Quickstart

Install Docker and docker-compose.

Create a `docker-compose.yml` based on the examples in the docker folder.
Download [conf.zip](https://github.com/Der-Henning/mopsy-react/blob/master/solr_configset/conf.zip) and unzip to `./solr_configset`.

Run
````bash
docker-compose up
````

This will run the application and all nessesary dependencies in a docker environment.

## Developement

### Prerequisites

I recommend developing in the configured docker environment. Using VSCode you can simply open the project in the Developement Container and all nessecary dependencies like solr, postgres and redis will be startet in docker.

### Install dependencies

````bash
npm install
````

### Start / Stop Server

````bash
npm run dev
````

Will run and expose
- backend on Port 4000
- react client on Port 3000
- Solr on Port 8983
- crawler on Port 5000

### Build app

````bash
npm build
````