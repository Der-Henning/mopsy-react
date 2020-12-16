# Use NodeJS v12 as base image
FROM node:12 AS builder

# Set Working directory
WORKDIR /usr/mopsy

# Install NodeJS modules and build app
COPY . .
RUN npm ci
RUN npm run build

FROM node:12-alpine
WORKDIR /usr/mopsy
ENV NODE_ENV=production

RUN mkdir /server
RUN mkdir /client

COPY ./server/package.json ./server/
COPY ./server/package-lock.json ./server/
COPY ./solr_configset ./solr_configset
COPY --from=builder /usr/mopsy/client/build client/build
COPY --from=builder /usr/mopsy/server/build server/build

WORKDIR /usr/mopsy/server

RUN npm ci

# Start Server
CMD ["npm", "start"]