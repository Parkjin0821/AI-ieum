// 김장대전 시안 영상 만들기용 로컬 서버 — make.html을 띄우고, 브라우저가 만든 영상·미리보기를 이 폴더에 저장한다.
//   node 영상시안/server.mjs   →   http://127.0.0.1:5190/make.html
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "POST" && url.pathname === "/save") {
    const name = path.basename(url.searchParams.get("name") || "");
    if (!/^[\w가-힣.\-]+\.(mp4|jpg|png|webm)$/.test(name)) { res.writeHead(400).end("bad name"); return; }
    const chunks = [];
    req.on("data", c => chunks.push(c)).on("end", () => {
      const buf = Buffer.concat(chunks);
      fs.writeFileSync(path.join(dir, name), buf);
      console.log(`saved ${name} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
      res.writeHead(200).end("ok");
    });
    return;
  }
  const file = path.join(dir, path.basename(url.pathname === "/" ? "make.html" : decodeURIComponent(url.pathname)));
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(5190, "127.0.0.1", () => console.log("http://127.0.0.1:5190/make.html"));
