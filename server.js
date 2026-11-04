// API de tarefas simples, sem dependências externas (só Node.js).
// Os dados ficam em um arquivo JSON dentro de DATA_DIR, que no Docker é um volume.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "tarefas.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

function carregar() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function salvar(tarefas) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tarefas, null, 2));
}

function responder(res, status, corpo) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(corpo));
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let dados = "";
    req.on("data", (c) => {
      dados += c;
      if (dados.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(dados ? JSON.parse(dados) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const url = req.url.split("?")[0];

  if (method === "GET" && url === "/") {
    return responder(res, 200, {
      mensagem: "API de tarefas rodando dentro do Docker 🐳",
      host: require("os").hostname(),
      rotas: ["GET /health", "GET /tarefas", "POST /tarefas", "DELETE /tarefas/:id"],
    });
  }

  if (method === "GET" && url === "/health") {
    return responder(res, 200, { status: "ok" });
  }

  if (method === "GET" && url === "/tarefas") {
    return responder(res, 200, carregar());
  }

  if (method === "POST" && url === "/tarefas") {
    try {
      const { titulo } = await lerCorpo(req);
      if (!titulo || typeof titulo !== "string") {
        return responder(res, 400, { erro: "Informe um 'titulo' (texto)." });
      }
      const tarefas = carregar();
      const nova = { id: Date.now(), titulo: titulo.trim(), criadaEm: new Date().toISOString() };
      tarefas.push(nova);
      salvar(tarefas);
      return responder(res, 201, nova);
    } catch {
      return responder(res, 400, { erro: "JSON inválido." });
    }
  }

  const m = url.match(/^\/tarefas\/(\d+)$/);
  if (method === "DELETE" && m) {
    const id = Number(m[1]);
    const tarefas = carregar();
    const restantes = tarefas.filter((t) => t.id !== id);
    if (restantes.length === tarefas.length) {
      return responder(res, 404, { erro: "Tarefa não encontrada." });
    }
    salvar(restantes);
    return responder(res, 200, { removida: id });
  }

  responder(res, 404, { erro: "Rota não encontrada." });
});

server.listen(PORT, "0.0.0.0", () => console.log(`Servidor na porta ${PORT}`));

// Permite que o Docker encerre o container de forma limpa (docker stop)
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
