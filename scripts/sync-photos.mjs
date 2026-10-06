// 한국관광공사 TourAPI(KorService2)에서 시·군·구마다 관광지 사진을 받아 shared/region-photos.js로 저장
//   키: 프로젝트 폴더 .env 에  TOURAPI_KEY=발급키  (공공데이터포털 '한국관광공사_국문 관광정보 서비스_GW', .env는 커밋 안 됨)
//   실행: node scripts/sync-photos.mjs           사진 받기
//         node scripts/sync-photos.mjs --probe   법정동 코드만 확인 (광역 이름·코드가 바뀌었는지)
// 공공누리 제1유형(출처표시) 사진만 쓴다 — 화면에서 칸에 맞춰 잘라 보여주므로 3유형(변경금지)은 뺀다.
// KorService2는 지역코드(areaCode) 대신 법정동 코드(lDongRegnCd·lDongSignguCd)로 찾는다. 코드는 API에서 받아 이름으로 맞춘다.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://apis.data.go.kr/B551011/KorService2";
const PER_REGION = 5;
const OUT = path.join(root, "shared", "region-photos.js");

/** 앱의 지역 목록 (shared/shared.js를 그대로 읽어 씀) */
export function loadRegions() {
  const store = {}, ctx = { window: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {}, querySelectorAll: () => [], documentElement: { dataset: {} } }, matchMedia: () => ({ matches: false }), console };
  ctx.window = ctx; vm.createContext(ctx);
  for (const f of ["workflow.js", "template-rules.js", "templates-data.js", "shared.js"])
    vm.runInContext(fs.readFileSync(path.join(root, "shared", f), "utf8"), ctx, { filename: f });
  return ctx.Shared.REGIONS.map(r => ({ id: r.id, short: r.short, name: r.name }));
}

/** 앱 지역 약칭 → 법정동 광역 이름에 들어 있어야 하는 말 (통합특별시 출범 전후 이름 모두) */
const SIDO_HINT = { 광주: ["광주"], 전남: ["전라남도", "전남"], 전북: ["전북", "전라북도"] };

/**
 * 앱 지역 id → 법정동 코드
 * @param regns  [{code, name}] 광역
 * @param signgu {광역코드: [{code, name}]} 시·군·구
 */
export function matchRegions(regions, regns, signgu) {
  const out = {}, missing = [];
  for (const r of regions) {
    const cands = regns.filter(g => SIDO_HINT[r.short].some(h => g.name.includes(h)));
    let hit = null;
    for (const g of cands) {
      const list = signgu[g.code] || [], s = list.find(x => x.name === r.name);
      // 전주시처럼 아래에 구(전주시 완산구 …)가 따로 있으면 관광지가 구 코드에 들어 있어서 함께 찾는다
      if (s) { hit = { regn: g.code, regnName: g.name, signgu: s.code, subs: list.filter(x => x.name.startsWith(r.name + " ")).map(x => x.code) }; break; }
    }
    if (hit) out[r.id] = hit; else missing.push(r.id);
  }
  return { codes: out, missing };
}

/** 관광지 목록에서 1유형 사진만, 같은 사진 빼고 n장 */
export function pickPhotos(items, n = PER_REGION) {
  const seen = new Set(), out = [];
  for (const it of items) {
    const src = (it.firstimage || "").replace(/^http:/, "https:");
    if (!src || it.cpyrhtDivCd !== "Type1" || seen.has(src)) continue;
    seen.add(src); out.push({ src, title: it.title || "" });
    if (out.length >= n) break;
  }
  return out;
}

export const render = data =>
  "/* 자동 생성 — node scripts/sync-photos.mjs (한국관광공사 TourAPI). 직접 고치지 말 것 */\n" +
  "(function (root) {\n  root.AIIEUM_PHOTOS = " + JSON.stringify(data, null, 1) + ";\n" +
  "})(typeof window !== \"undefined\" ? window : globalThis);\n";

function readKey() {
  if (process.env.TOURAPI_KEY) return process.env.TOURAPI_KEY.trim();
  const f = path.join(root, ".env");
  if (!fs.existsSync(f)) return "";
  const m = fs.readFileSync(f, "utf8").match(/^\s*TOURAPI_KEY\s*=\s*"?([^"\r\n]+)"?/m);
  return m ? m[1].trim() : "";
}

async function call(key, op, params) {
  const q = new URLSearchParams({ MobileOS: "ETC", MobileApp: "AIieum", _type: "json", numOfRows: "100", pageNo: "1", ...params });
  // 공공데이터포털 키는 이미 인코딩된 값이 많아서 그대로 붙인다
  const url = `${BASE}/${op}?serviceKey=${key.includes("%") ? key : encodeURIComponent(key)}&${q}`;
  const res = await fetch(url);
  const text = await res.text();
  let j; try { j = JSON.parse(text); } catch { throw new Error(`${op}: JSON이 아닌 응답 (${res.status}) ${text.slice(0, 200)}`); }
  const h = j.response && j.response.header;
  if (!h || h.resultCode !== "0000") throw new Error(`${op}: ${h ? `${h.resultCode} ${h.resultMsg}` : text.slice(0, 200)}`);
  const items = j.response.body.items;
  const list = items && items.item ? items.item : [];
  return Array.isArray(list) ? list : [list];
}
// ldongCode2 응답 필드 이름이 버전마다 달라 둘 다 받음
const asCode = x => ({ code: String(x.code ?? x.lDongRegnCd ?? x.lDongSignguCd ?? ""), name: String(x.name ?? x.lDongRegnNm ?? x.lDongSignguNm ?? "") });

async function main() {
  const key = readKey();
  if (!key) { console.error("✗ TOURAPI_KEY가 없어요 — 프로젝트 폴더 .env에 TOURAPI_KEY=발급키 한 줄을 넣어주세요"); process.exit(1); }
  const regions = loadRegions();
  const regns = (await call(key, "ldongCode2", {})).map(asCode);
  const wanted = regns.filter(g => Object.values(SIDO_HINT).flat().some(h => g.name.includes(h)));
  if (process.argv.includes("--probe")) {
    console.log("광역(법정동):", regns.map(g => `${g.code} ${g.name}`).join(" · "));
    for (const g of wanted) console.log(`  ${g.code} ${g.name}:`, (await call(key, "ldongCode2", { lDongRegnCd: g.code })).map(asCode).map(s => `${s.code} ${s.name}`).join(", "));
    return;
  }
  const signgu = {};
  for (const g of wanted) signgu[g.code] = (await call(key, "ldongCode2", { lDongRegnCd: g.code })).map(asCode);
  const { codes, missing } = matchRegions(regions, wanted, signgu);
  if (missing.length) console.warn("⚠ 법정동 코드를 못 맞춘 지역:", missing.join(", "));

  const out = {};
  for (const r of regions) {
    const c = codes[r.id];
    if (!c) continue;
    let items = [];
    for (const sg of [c.signgu, ...c.subs])
      items = items.concat(await call(key, "areaBasedList2", { lDongRegnCd: c.regn, lDongSignguCd: sg, contentTypeId: "12", arrange: "Q", numOfRows: "60" }));
    const photos = pickPhotos(items);
    if (photos.length) out[r.id] = photos;
    console.log(`${photos.length ? "✔" : "·"} ${r.id}  ${photos.length}장 (관광지 ${items.length}곳 중 1유형 사진)`);
  }
  const data = { generatedAt: new Date().toISOString(), source: "한국관광공사 TourAPI", license: "공공누리 제1유형", regions: out };
  fs.writeFileSync(OUT, render(data));
  console.log(`\n✔ ${Object.keys(out).length}/${regions.length}개 지역, 사진 ${Object.values(out).flat().length}장 → shared/region-photos.js`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main().catch(e => { console.error("✗", e.message); process.exit(1); });
