# Use NodeJS v12 as base image
FROM node:12

# Set Working directory
WORKDIR /usr/mopsy

# Install NodeJS modules and build app
COPY . .
RUN npm ci
RUN npm run build

# Expose App at port 8080
EXPOSE 8080

# Start Server
CMD ["npm", "start"]