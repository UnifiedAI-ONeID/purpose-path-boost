# Use the official Node.js image.
# https://hub.docker.com/_/node
FROM node:18-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY backend/package*.json ./

# Install production dependencies.
RUN npm ci --only=production

# Copy local code to the container image.
COPY backend/ .

# Build the application (if needed - currently using ts-node-dev in dev, but should build for prod)
# We need typescript for building
RUN npm install typescript
RUN npm run build

# Run the web service on container startup.
CMD [ "node", "dist/index.js" ]
