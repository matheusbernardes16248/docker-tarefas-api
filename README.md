# 🐳 docker-tarefas-api

Projeto simples para praticar **Docker** e **Docker Compose**: uma API REST de tarefas em Node.js (sem dependências externas) empacotada em container.

## O que este projeto demonstra

- **Dockerfile** com imagem leve (`node:20-alpine`), cache de camadas e execução com usuário não-root
- **HEALTHCHECK** para o Docker monitorar a saúde da aplicação
- **Variáveis de ambiente** (`PORT`, `DATA_DIR`)
- **Volume** para persistir os dados fora do container
- **Docker Compose** para subir tudo com um único comando
- **.dockerignore** para manter a imagem enxuta

## Pré-requisito

[Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado (inclui o Docker Compose).

## Como rodar

### Opção 1 — Docker Compose (recomendado)

```bash
docker compose up --build
```

Para rodar em segundo plano: `docker compose up -d --build`

### Opção 2 — Só com Docker

```bash
docker build -t tarefas-api .
docker run -d --name tarefas-api -p 3000:3000 -v tarefas-data:/data tarefas-api
```

## Testando a API

```bash
# Status da API
curl http://localhost:3000/

# Health check
curl http://localhost:3000/health

# Criar uma tarefa
curl -X POST http://localhost:3000/tarefas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Estudar Docker"}'

# Listar tarefas
curl http://localhost:3000/tarefas

# Remover uma tarefa (troque 123 pelo id retornado)
curl -X DELETE http://localhost:3000/tarefas/123
```

> No PowerShell, use `curl.exe` (ou `Invoke-RestMethod`) em vez de `curl`.

## Comandos Docker úteis

```bash
docker ps                      # containers rodando
docker logs -f tarefas-api     # logs em tempo real
docker exec -it tarefas-api sh # abrir um terminal dentro do container
docker compose down            # parar e remover o container (o volume continua)
docker compose down -v         # parar e remover também o volume (apaga os dados)
```

## Testando a persistência (volume)

1. Suba o projeto e crie uma tarefa.
2. Rode `docker compose down` (remove o container).
3. Rode `docker compose up -d` de novo e liste as tarefas: elas continuam lá, porque estão no volume `tarefas-data`.

## Estrutura

```
.
├── server.js            # API em Node.js
├── package.json
├── Dockerfile           # receita da imagem
├── docker-compose.yml   # orquestração (serviço + volume)
├── .dockerignore
└── README.md
```

## Próximos passos (ideias)

- Trocar o arquivo JSON por um banco (PostgreSQL ou MongoDB) em outro serviço do Compose
- Adicionar um pipeline (GitHub Actions) que faz o build da imagem a cada push
- Publicar a imagem no Docker Hub
