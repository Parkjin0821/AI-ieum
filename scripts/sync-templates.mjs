// data/templates.json → shared/templates-data.js (두 페이지가 파일로 바로 열어도 읽히도록)
// 원본은 항상 data/templates.json. 실행: node scripts/sync-templates.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data/templates.json"), "utf8"));
export const render = list =>
  "/* 자동 생성 — 직접 고치지 말고 data/templates.json을 고친 뒤 node scripts/sync-templates.mjs */\n" +
  "(function (root) {\n  const T = " + JSON.stringify(list, null, 1) + ";\n" +
  "  if (typeof module === \"object\" && module.exports) module.exports = T; else root.AIIEUM_TEMPLATES = T;\n" +
  "})(typeof window !== \"undefined\" ? window : globalThis);\n";

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  fs.writeFileSync(path.join(root, "shared/templates-data.js"), render(data));
  console.log(`✔ 템플릿 ${data.length}개를 shared/templates-data.js에 넣었어요`);
}
