FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
# When Compose builds with context `./frontend`, package files are at the context root
COPY package*.json ./
# Use error loglevel to surface install errors during Docker build
RUN npm ci --loglevel=error

# Copy source and build (context is frontend/)
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# Simple static server for built assets
RUN npm install -g serve --silent

# Copy built artifacts
COPY --from=build /app/dist ./dist

# Default frontend port; Compose will override via env
ENV FRONTEND_PORT=4173
EXPOSE 4173

CMD ["sh", "-c", "serve -s dist -l ${FRONTEND_PORT}"]
