FROM node:20-alpine

LABEL org.opencontainers.image.title="docker-tarefas-api" \
      org.opencontainers.image.description="API de tarefas em Node.js para praticar Docker" \
      org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data

WORKDIR /app

COPY package.json ./
COPY server.js ./

RUN mkdir -p /data && chown -R node:node /data /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
