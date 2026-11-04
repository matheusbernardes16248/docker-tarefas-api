# Imagem base leve, com Node.js 20
FROM node:20-alpine

# Pasta de trabalho dentro do container
WORKDIR /app

# Copia primeiro o package.json (aproveita o cache de camadas do Docker)
COPY package.json ./

# Copia o restante do código
COPY server.js ./

# Variáveis de ambiente padrão
ENV PORT=3000 \
    DATA_DIR=/data

# Cria a pasta de dados e usa um usuário sem privilégios de root (boa prática de segurança)
RUN mkdir -p /data && chown -R node:node /data /app
USER node

# Documenta a porta usada pela aplicação
EXPOSE 3000

# Verifica se a aplicação está saudável
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Comando que inicia a aplicação
CMD ["node", "server.js"]
