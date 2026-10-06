// 배포용 빌드 — 사용자·관리자를 서로 다른 사이트로 따로 올릴 수 있게 dist/user, dist/admin을 만든다.
// 각 폴더에는 그 페이지에 필요한 파일만 들어간다 (발표 자료 pptx·pdf 같은 건 절대 안 들어감).
//
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=eyJ... \
//   USER_URL=https://ai-ieum.vercel.app ADMIN_URL=https://ai-ieum-admin.vercel.app \
//   node scripts/build.mjs
//
// 환경변수가 없으면 공용 DB 없이(각 도메인에만 저장) 빌드된다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = process.env;
const config = {
  supabaseUrl: env.SUPABASE_URL || "",
  supabaseAnonKey: env.SUPABASE_ANON_KEY || "",
  userAppUrl: env.USER_URL || "",
  adminAppUrl: env.ADMIN_URL || ""
};
const SHARED = ["ai-ieum.css", "workflow.js", "template-rules.js", "templates-data.js", "region-photos.js", "shared.js"];

fs.rmSync(path.join(root, "dist"), { recursive: true, force: true });
for (const app of ["user", "admin"]) {
  const out = path.join(root, "dist", app);
  fs.mkdirSync(path.join(out, "shared"), { recursive: true });
  fs.copyFileSync(path.join(root, "apps", app, "index.html"), path.join(out, "index.html"));
  for (const f of SHARED) fs.copyFileSync(path.join(root, "shared", f), path.join(out, "shared", f));
  fs.writeFileSync(path.join(out, "config.js"), `window.AIIEUM_CONFIG = ${JSON.stringify(config, null, 2)};\n`);
  const files = fs.readdirSync(out, { recursive: true }).filter(f => fs.statSync(path.join(out, f)).isFile());
  console.log(`✔ dist/${app}  (${files.length}개 파일: ${files.join(", ")})`);
}
console.log(config.supabaseUrl ? `공용 DB: ${config.supabaseUrl}` : "⚠ 공용 DB 없음 — 두 사이트가 데이터를 공유하지 못해요 (docs/deploy.md 참고)");
