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
COPY --from=builder /usr/mopsy/client/build ./client/build
COPY --from=builder /usr/mopsy/server/build ./server/build
COPY --from=builder /usr/mopsy/server/node_modules ./server/

WORKDIR /usr/mopsy/server

# Start Server
CMD ["npm", "start"]
