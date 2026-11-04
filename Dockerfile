
FROM node:20-alpine


WORKDIR /app


COPY package.json ./


COPY server.js ./


ENV PORT=3000 \
    DATA_DIR=/data


RUN mkdir -p /data && chown -R node:node /data /app
USER node


EXPOSE 3000


HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
