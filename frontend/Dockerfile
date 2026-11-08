FROM node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY frontend/package*.json ./
COPY frontend/graphics/package*.json ./graphics/
RUN npm ci --loglevel=error

COPY frontend/ .
COPY packages/ /packages/
COPY runtimes/shared/ /runtimes/shared/
COPY integrations/renderers.lock.json /integrations/renderers.lock.json

EXPOSE 4173

CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 --port ${FRONTEND_PORT:-4173}"]

COPY runtimes/sky-adapter/ /runtimes/sky-adapter/
