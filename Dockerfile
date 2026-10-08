FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402

ENV TZ="Europe/Berlin"
ENV npm_config_ignore_scripts=true

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Run as the unprivileged "node" user; logs and data must be writable for it
RUN mkdir -p logs data && chown -R node:node /app
USER node

# The health endpoint only listens on localhost by default (see HTTP_HOST), which is enough for this check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:7635/health',{signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD [ "npm", "start" ]
