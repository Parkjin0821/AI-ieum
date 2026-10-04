// templates.json 규칙 검사 — 하나라도 어기면 exit 1 (CI에서 실행)
// 규칙 본문은 shared/template-rules.js (관리자 화면의 실시간 검사와 같은 규칙)
// 실행: node scripts/validate-templates.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const R = require("../shared/template-rules.js");

let list;
try { list = JSON.parse(read("data/templates.json")); }
catch (e) { console.error("data/templates.json을 읽지 못했어요:", e.message); process.exit(1); }
if (!Array.isArray(list)) { console.error("최상위는 배열이어야 해요"); process.exit(1); }

const errors = [];
if (list.length < 8 || list.length > 12) errors.push(`  ✖ 전체: 템플릿은 8~12개여야 해요 (지금 ${list.length}개)`);
const anchors = new Set([...read("docs/references.md").matchAll(/<a id="([^"]+)"><\/a>/g)].map(m => m[1]));
const ids = new Set();
for (const t of list) {
  if (ids.has(t.id)) errors.push(`  ✖ ${t.id}: id 중복`); ids.add(t.id);
  for (const m of R.validateTemplate(t, { anchors })) errors.push(`  ✖ ${t.id || "(id 없음)"}: ${m}`);
}
const missing = R.missingTypes(list);
if (missing.length) errors.push(`  ✖ 커버: 템플릿이 없는 유형 — ${missing.join(", ")}`);

// 화면이 읽는 사본(shared/templates-data.js)이 원본과 같은지
try {
  const copy = require("../shared/templates-data.js");
  if (JSON.stringify(copy) !== JSON.stringify(list)) errors.push("  ✖ shared/templates-data.js가 data/templates.json과 달라요 → node scripts/sync-templates.mjs");
} catch { errors.push("  ✖ shared/templates-data.js가 없어요 → node scripts/sync-templates.mjs"); }

if (errors.length) { console.error(`templates.json 검사 실패 (${errors.length}건)\n` + errors.join("\n")); process.exit(1); }
const grid = R.AGES.map(a => `  ${a.padEnd(6)} ` + R.CATS.map(c => `${c} ${list.filter(t => t.categories.includes(c) && t.ages.includes(a)).length}`).join("  ")).join("\n");
console.log(`✔ templates.json 통과 — 템플릿 ${list.length}개, 12유형 모두 커버\n${grid}`);
