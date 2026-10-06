// 페이지 스크립트 문법 검사 — index.html 안의 <script> 블록과 shared/*.js를 실행하지 않고 컴파일만 해 본다.
// (테스트는 로직만 보므로, 화면 코드에 괄호 하나 빠져도 통과하던 문제를 막음)
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = [];
for (const app of ["user", "admin"]) {
  const file = path.join("apps", app, "index.html");
  const html = fs.readFileSync(path.join(root, file), "utf8");
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => targets.push([`${file} <script> #${i + 1}`, m[1]]));
}
for (const f of fs.readdirSync(path.join(root, "shared")).filter(f => f.endsWith(".js")))
  targets.push([`shared/${f}`, fs.readFileSync(path.join(root, "shared", f), "utf8")]);

let bad = 0;
for (const [name, code] of targets) {
  try { new vm.Script(code, { filename: name }); }
  catch (e) { bad++; console.error(`✗ ${name}: ${e.message}`); }
}
if (bad) process.exit(1);
console.log(`문법 검사 통과: ${targets.length}개`);
