![Node.js CI](https://github.com/Der-Henning/mopsy-react/workflows/Node.js%20CI/badge.svg?branch=master)

# mopsy-react

## Quickstart

````
git clone https://github.com/Der-Henning/mopsy-react.git
docker-compose up
````

This will build the application and run it and all nessesary dependencies in a docker environment.

## Developement

### Prerequisites

Install docker and docker-compose

### Install dependencies

````
make install
````

### Start / Stop Server

````
make start
make stop
````

App is exposed on Port 1234
Solr is exposed on Port 1235
Backend is exposed on Port 1236

### Reset Volumes

````
make reset
````

### Open bash in developement container

````
make bash
````

### Build app

````
make build
````