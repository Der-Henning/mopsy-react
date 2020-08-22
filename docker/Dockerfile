# Use NodeJS v12 as base image
FROM node:12

# Set Working directory
WORKDIR /usr/mopsy

# Copy package informations
#COPY package*.json ./
#COPY client/package*.json ./client/
#COPY server/package*.json ./server/

# Install NodeJS modules
COPY . .
RUN npm ci
RUN npm run build

# Copy Production build (.gitignore)
#COPY . .

# Expose App at port 8080
EXPOSE 8080

# Start Server
CMD ["bash", "entrypoint.sh"]