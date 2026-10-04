// 두 사이트를 Vercel에 다시 올린다 (처음 한 번은 `npx vercel login`을 본인이 직접).
//   node scripts/deploy-vercel.mjs
// 공용 DB를 붙일 때는 SUPABASE_URL, SUPABASE_ANON_KEY 환경변수를 함께 주면 된다.
// ⚠ `vercel link`가 배포 폴더에 접근 토큰(.env.local)을 만들므로, 올리기 전에 반드시 지운다.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITES = [
  { dir: "dist/user", project: "ai-ieum", url: "https://ai-ieum.vercel.app" },
  { dir: "dist/admin", project: "ai-ieum-admin", url: "https://ai-ieum-admin.vercel.app" }
];
const run = cmd => execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });

process.env.USER_URL ||= SITES[0].url;
process.env.ADMIN_URL ||= SITES[1].url;
run("node scripts/build.mjs");

for (const s of SITES) {
  run(`npx --yes vercel@latest link --yes --project ${s.project} --cwd ${s.dir}`);
  const token = path.join(root, s.dir, ".env.local");
  if (fs.existsSync(token)) fs.rmSync(token);                 // 토큰은 절대 공개 사이트로 올리지 않음
  const files = fs.readdirSync(path.join(root, s.dir));
  if (files.some(f => f.startsWith(".env"))) throw new Error(`${s.dir}에 .env 파일이 남아 있어 중단합니다`);
  run(`npx --yes vercel@latest deploy --prod --yes --cwd ${s.dir}`);
  console.log(`✔ ${s.project} → ${s.url}`);
}
