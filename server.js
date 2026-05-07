const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "capsules.json");
const COLORS = ["pink", "blue", "yellow", "green", "purple"];

const seedStories = [
  "Hôm nay mình đi bộ dưới trời mưa nhỏ. Một cô bán hoa thấy mình không có ô nên dúi cho mình một chiếc túi nilon để che điện thoại. Việc nhỏ thôi, nhưng mình thấy cả ngày dịu lại.",
  "Có lần mình nấu ăn bị cháy một chút. Bạn cùng phòng không chê, chỉ cười rồi bảo: mùi này giống bếp nhà hồi nhỏ. Tối đó tụi mình ăn hết sạch.",
  "Sáng nay bé mèo nhà hàng xóm chạy theo mình đến tận cổng. Nó ngồi đó nhìn như tiễn đi làm. Mình đã cười suốt quãng đường.",
  "Mình nhận được tin nhắn từ một người bạn cũ: 'Tớ vừa nghe bài này và nhớ đến cậu'. Chỉ một dòng thôi mà làm mình thấy mình vẫn được nhớ.",
  "Hôm qua mình tự mua cho mình một cái bánh nhỏ, cắm một cây nến, và chúc mừng vì đã vượt qua một tuần khó. Không cần dịp lớn mới được vui.",
  "Một em bé trong thang máy nhìn sticker trên laptop của mình rồi nói 'đẹp quá'. Mình thấy phiên bản trẻ con trong mình cũng được khen theo.",
  "Mẹ gọi hỏi mình ăn cơm chưa. Lần này mình không vội cúp máy, hai mẹ con kể chuyện linh tinh gần nửa tiếng. Tắt máy xong thấy lòng ấm hẳn.",
  "Mình nhặt được một tờ giấy note ai đó dán trong thư viện: 'Bạn đang làm tốt hơn bạn nghĩ'. Mình để nó trong ví đến giờ."
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const capsules = seedStories.map((content, index) => ({
      id: crypto.randomUUID(),
      content,
      color: COLORS[index % COLORS.length],
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      hearts: Math.floor(Math.random() * 12),
      thanks: Math.floor(Math.random() * 7)
    }));
    await fs.writeFile(DATA_FILE, JSON.stringify(capsules, null, 2), "utf8");
  }
}

async function readCapsules() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeCapsules(capsules) {
  await fs.writeFile(DATA_FILE, JSON.stringify(capsules, null, 2), "utf8");
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(body);
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
    req.on("error", reject);
  });
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/stats") {
    const capsules = await readCapsules();
    sendJson(res, 200, { count: capsules.length });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/capsules/random") {
    const capsules = await readCapsules();
    if (capsules.length === 0) {
      sendError(res, 404, "No capsules available.");
      return;
    }
    const capsule = capsules[Math.floor(Math.random() * capsules.length)];
    sendJson(res, 200, capsule);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/capsules") {
    const body = await readBody(req);
    const content = String(body.content || "").trim();
    if (content.length < 12) {
      sendError(res, 400, "Story must be at least 12 characters.");
      return;
    }
    if (content.length > 420) {
      sendError(res, 400, "Story must be 420 characters or fewer.");
      return;
    }

    const capsules = await readCapsules();
    const capsule = {
      id: crypto.randomUUID(),
      content,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      createdAt: new Date().toISOString(),
      hearts: 0,
      thanks: 0
    };
    capsules.unshift(capsule);
    await writeCapsules(capsules);
    sendJson(res, 201, capsule);
    return;
  }

  const reactionMatch = url.pathname.match(/^\/api\/capsules\/([^/]+)\/reactions$/);
  if (req.method === "POST" && reactionMatch) {
    const body = await readBody(req);
    const type = body.type === "thanks" ? "thanks" : body.type === "hearts" ? "hearts" : null;
    if (!type) {
      sendError(res, 400, "Invalid reaction type.");
      return;
    }

    const capsules = await readCapsules();
    const capsule = capsules.find((item) => item.id === reactionMatch[1]);
    if (!capsule) {
      sendError(res, 404, "Capsule not found.");
      return;
    }
    capsule[type] = (capsule[type] || 0) + 1;
    await writeCapsules(capsules);
    sendJson(res, 200, capsule);
    return;
  }

  sendError(res, 404, "API route not found.");
}

async function serveStatic(req, res, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const absolutePath = path.normalize(path.join(ROOT, requestedPath));
  const relativePath = path.relative(ROOT, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath) || relativePath.split(path.sep)[0] === "data") {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    res.writeHead(200, {
      "content-type": mimeTypes[ext] || "application/octet-stream"
    });
    res.end(file);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    sendError(res, 500, error.message || "Internal server error.");
  }
});

ensureDataFile()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Happy Box is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
