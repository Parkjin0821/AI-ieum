// 가짜 공용 DB가 supabase/schema.sql과 같은 핵심 규칙을 지키는지 — 실행: node --test tests/mock-db.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { startMockDb } from "../scripts/mock-db.mjs";

const PORT = 5199;
const server = startMockDb(PORT);
const call = (method, table, body, prefer) => fetch(`http://127.0.0.1:${PORT}/rest/v1/${table}`, { method, headers: { "Content-Type": "application/json", Prefer: prefer || "" }, body: body && JSON.stringify(body) });
const UPSERT = "resolution=merge-duplicates";
test.after(() => server.close());

test("공용 DB: 1차를 건너뛰는 상태 변경은 거부", async () => {
  assert.equal((await call("POST", "content_plans", [{ id: "P1", region: "전남 보성군", status: "gate1_wait", data: {} }], UPSERT)).status, 201);
  assert.equal((await call("POST", "content_plans", [{ id: "P1", region: "전남 보성군", status: "gate3_wait", data: {} }], UPSERT)).status, 400);
  assert.equal((await call("POST", "content_plans", [{ id: "P1", region: "전남 보성군", status: "making", data: {} }], UPSERT)).status, 201);
});

test("공용 DB: 결정 기록은 추가만 — 같은 id 덮어쓰기·삭제 거부", async () => {
  assert.equal((await call("POST", "review_logs", [{ id: "L1", plan_id: "P1", at: "2026-10-04T00:00:00Z", data: {} }])).status, 201);
  assert.equal((await call("POST", "review_logs", [{ id: "L1", plan_id: "P1", at: "2026-10-04T00:00:00Z", data: { x: 1 } }], UPSERT)).status, 409);
  assert.equal((await call("DELETE", "review_logs?id=eq.L1")).status, 403);
  assert.equal((await (await call("GET", "review_logs?select=*")).json()).length, 1);
});

test("공용 DB: 관리자 설정(app_config)은 저장·되돌리기 가능", async () => {
  assert.equal((await call("POST", "app_config", [{ key: "regions", value: { a: 1 } }], UPSERT)).status, 201);
  assert.equal((await call("DELETE", "app_config?key=eq.regions")).status, 204);
  assert.equal((await (await call("GET", "app_config?select=*")).json()).length, 0);
});