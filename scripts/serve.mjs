// 로컬 미리보기 — 실제 배포처럼 두 페이지를 서로 다른 주소(origin)로 띄운다
//   node scripts/serve.mjs          사용자 :5178 · 관리자 :5179 · 가짜 공용 DB(Supabase 흉내) :5180
//   node scripts/serve.mjs --local  공용 DB 없이 — 두 페이지가 데이터를 공유하지 못하는 상태 확인용
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startMockDb } from "./mock-db.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL = process.argv.includes("--local");
const PORT = { user: 5178, admin: 5179, db: 5180 };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".css": "text/css; charset=utf-8", ".md": "text/markdown; charset=utf-8" };
const config = {
  supabaseUrl: LOCAL ? "" : `http://127.0.0.1:${PORT.db}`,
  supabaseAnonKey: LOCAL ? "" : "local-dev-anon-key",
  userAppUrl: `http://127.0.0.1:${PORT.user}/`,
  adminAppUrl: `http://127.0.0.1:${PORT.admin}/`
};

function serveApp(name, port) {
  const appDir = path.join(root, "apps", name), sharedDir = path.join(root, "shared");
  http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (rel === "/config.js") {
      res.writeHead(200, { "Content-Type": TYPES[".js"], "Cache-Control": "no-store" });
      return res.end(`window.AIIEUM_CONFIG = ${JSON.stringify(config)};\n`);
    }
    const file = rel.startsWith("/shared/")
      ? path.join(sharedDir, rel.slice("/shared/".length))
      : path.join(appDir, rel === "/" ? "index.html" : rel.slice(1));
    if (!file.startsWith(appDir) && !file.startsWith(sharedDir)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404).end("not found"); return; }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" }).end(buf);
    });
  }).listen(port, "127.0.0.1");
}

serveApp("user", PORT.user);
serveApp("admin", PORT.admin);
if (!LOCAL) startMockDb(PORT.db);
console.log(`사용자  ${config.userAppUrl}\n관리자  ${config.adminAppUrl}\n공용 DB ${LOCAL ? "없음 (--local)" : config.supabaseUrl + " (가짜 Supabase, 끄면 내용 사라짐)"}`);
