const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "tarefas.json");
const MAX_BODY_BYTES = 1e6;

fs.mkdirSync(DATA_DIR, { recursive: true });

function carregar() {
  try {
    const conteudo = fs.readFileSync(DATA_FILE, "utf8");
    const dados = JSON.parse(conteudo);
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function salvar(tarefas) {
  const temporario = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporario, JSON.stringify(tarefas, null, 2));
  fs.renameSync(temporario, DATA_FILE);
}

function responder(res, status, corpo) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(corpo));
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let dados = "";
    req.on("data", (pedaco) => {
      dados += pedaco;
      if (dados.length > MAX_BODY_BYTES) {
        reject(new Error("Corpo da requisição muito grande."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(dados ? JSON.parse(dados) : {});
      } catch {
        reject(new Error("JSON inválido."));
      }
    });
    req.on("error", reject);
  });
}

function rotas(req, res, url) {
  const { method } = req;

  if (method === "GET" && url === "/") {
    return responder(res, 200, {
      mensagem: "API de tarefas rodando dentro do Docker 🐳",
      host: os.hostname(),
      rotas: [
        "GET /health",
        "GET /tarefas",
        "POST /tarefas",
        "PUT /tarefas/:id",
        "DELETE /tarefas/:id",
      ],
    });
  }

  if (method === "GET" && url === "/health") {
    return responder(res, 200, { status: "ok", uptime: process.uptime() });
  }

  if (method === "GET" && url === "/tarefas") {
    return responder(res, 200, carregar());
  }

  if (method === "POST" && url === "/tarefas") {
    return criarTarefa(req, res);
  }

  const correspondencia = url.match(/^\/tarefas\/(\d+)$/);
  if (correspondencia) {
    const id = Number(correspondencia[1]);
    if (method === "PUT") return atualizarTarefa(req, res, id);
    if (method === "DELETE") return removerTarefa(res, id);
  }

  return responder(res, 404, { erro: "Rota não encontrada." });
}

async function criarTarefa(req, res) {
  const { titulo } = await lerCorpo(req);
  if (typeof titulo !== "string" || !titulo.trim()) {
    return responder(res, 400, { erro: "Informe um 'titulo' (texto não vazio)." });
  }
  const tarefas = carregar();
  const nova = {
    id: Date.now(),
    titulo: titulo.trim(),
    concluida: false,
    criadaEm: new Date().toISOString(),
  };
  tarefas.push(nova);
  salvar(tarefas);
  return responder(res, 201, nova);
}

async function atualizarTarefa(req, res, id) {
  const corpo = await lerCorpo(req);
  const tarefas = carregar();
  const tarefa = tarefas.find((t) => t.id === id);
  if (!tarefa) {
    return responder(res, 404, { erro: "Tarefa não encontrada." });
  }
  if (corpo.titulo !== undefined) {
    if (typeof corpo.titulo !== "string" || !corpo.titulo.trim()) {
      return responder(res, 400, { erro: "'titulo' deve ser um texto não vazio." });
    }
    tarefa.titulo = corpo.titulo.trim();
  }
  if (corpo.concluida !== undefined) {
    if (typeof corpo.concluida !== "boolean") {
      return responder(res, 400, { erro: "'concluida' deve ser true ou false." });
    }
    tarefa.concluida = corpo.concluida;
  }
  salvar(tarefas);
  return responder(res, 200, tarefa);
}

function removerTarefa(res, id) {
  const tarefas = carregar();
  const restantes = tarefas.filter((t) => t.id !== id);
  if (restantes.length === tarefas.length) {
    return responder(res, 404, { erro: "Tarefa não encontrada." });
  }
  salvar(restantes);
  return responder(res, 200, { removida: id });
}

const server = http.createServer(async (req, res) => {
  const inicio = Date.now();
  const url = req.url.split("?")[0];

  res.on("finish", () => {
    console.log(`${req.method} ${url} -> ${res.statusCode} (${Date.now() - inicio}ms)`);
  });

  try {
    await rotas(req, res, url);
  } catch (erro) {
    responder(res, 400, { erro: erro.message || "Requisição inválida." });
  }
});

server.listen(PORT, "0.0.0.0", () => console.log(`Servidor na porta ${PORT}`));

function encerrar() {
  server.close(() => process.exit(0));
}
process.on("SIGTERM", encerrar);
process.on("SIGINT", encerrar);
