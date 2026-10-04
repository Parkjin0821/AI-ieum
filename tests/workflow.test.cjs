// 실행: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const W = require("../shared/workflow.js");

const base = () => ({ id: "p1", title: "가을 축제 × 김제", templateId: "festival-countdown", requestedBy: "박진영", status: "gate1_wait" });
const scenes = [{ idx: 1, label: "여는 장면" }, { idx: 2, label: "볼거리" }, { idx: 3, label: "일정·위치" }];
const allChecks = Object.fromEntries(W.CHECKS2.map(c => [c.key, true]));
const allPicks = { 1: "veo", 2: "kling", 3: "regen" };
const code = c => err => err instanceof W.WorkflowError && err.code === c;

function toGate2() {
  let p = W.transition(base(), { type: "pass" }, { reviewer: "이경준" }).plan;
  return W.transition(p, { type: "draftReady", scenes }, { reviewer: "시스템" }).plan;
}

test("정상 경로: 1차 → 제작 → 2차 → 3차 → 게시", () => {
  const p2 = toGate2();
  assert.equal(p2.status, "gate2_wait");
  const r2 = W.transition(p2, { type: "pass" }, { reviewer: "이경준", checklist: allChecks, scenePicks: allPicks });
  assert.equal(r2.plan.status, "gate3_wait");
  assert.deepEqual(r2.log.scenePicks, allPicks);
  const r3 = W.transition(r2.plan, { type: "pass" }, { reviewer: "박진", checklist: { final: true, caption: true }, uploadUrl: "https://youtube.com/shorts/x" });
  assert.equal(r3.plan.status, "published");
  assert.equal(r3.log.reviewer, "박진");
  assert.ok(r3.log.at);
});

test("1차를 건너뛸 수 없다", () => {
  assert.throws(() => W.transition(base(), { type: "pass", gate: 2 }, { reviewer: "이경준" }), code("GATE_SKIP"));
  assert.throws(() => W.transition(base(), { type: "draftReady", scenes }, { reviewer: "시스템" }), code("BAD_TRANSITION"));
  const making = W.transition(base(), { type: "pass" }, { reviewer: "이경준" }).plan;
  assert.throws(() => W.transition(making, { type: "pass" }, { reviewer: "이경준" }), code("BAD_TRANSITION"));
});

test("2차: 점검표 하나라도 빠지면 통과 불가", () => {
  const p2 = toGate2();
  for (const c of W.CHECKS2) {
    const cl = Object.assign({}, allChecks, { [c.key]: false });
    assert.throws(() => W.transition(p2, { type: "pass" }, { reviewer: "이경준", checklist: cl, scenePicks: allPicks }), code("CHECKLIST_MISSING"));
  }
});

test("2차: 장면 하나라도 미선택이면 통과 불가", () => {
  const p2 = toGate2();
  assert.throws(() => W.transition(p2, { type: "pass" }, { reviewer: "이경준", checklist: allChecks, scenePicks: { 1: "veo", 2: "kling" } }), code("SCENES_MISSING"));
  assert.throws(() => W.transition(p2, { type: "pass" }, { reviewer: "이경준", checklist: allChecks, scenePicks: { 1: "veo", 2: "kling", 3: "both" } }), code("SCENES_MISSING"));
});

test("2차: 요청자 본인은 통과 불가 (기본 켬), 설정으로 끌 수 있다", () => {
  const p2 = toGate2();
  const ctx = { reviewer: "박진영", checklist: allChecks, scenePicks: allPicks };
  assert.throws(() => W.transition(p2, { type: "pass" }, ctx), code("SELF_REVIEW"));
  const ok = W.transition(p2, { type: "pass" }, Object.assign({}, ctx, { settings: { forbidSelfReview: false } }));
  assert.equal(ok.plan.status, "gate3_wait");
});

test("반려: 상세 사유가 비면 저장되지 않는다", () => {
  assert.throws(() => W.transition(base(), { type: "reject" }, { reviewer: "이경준", reasonCategory: "사실 오류", reasonText: "   " }), code("NO_REASON_TEXT"));
  assert.throws(() => W.transition(base(), { type: "reject" }, { reviewer: "이경준", reasonText: "날짜 틀림" }), code("NO_REASON_CATEGORY"));
  const r = W.transition(base(), { type: "reject" }, { reviewer: "이경준", reasonCategory: "사실 오류", reasonText: "개막일이 10.3이 아니라 10.2" });
  assert.equal(r.plan.status, "rejected");
  assert.equal(r.log.decision, "reject");
  assert.equal(r.log.reasonText, "개막일이 10.3이 아니라 10.2");
});

test("3차: 확인 2개 전에는 게시 결정 불가", () => {
  const p2 = toGate2();
  const p3 = W.transition(p2, { type: "pass" }, { reviewer: "이경준", checklist: allChecks, scenePicks: allPicks }).plan;
  assert.throws(() => W.transition(p3, { type: "pass" }, { reviewer: "박진", checklist: { final: true } }), code("CHECKLIST_MISSING"));
});

test("반려 후 다시 요청하면 새 id로 1차부터, 원본은 그대로", () => {
  const rej = W.transition(base(), { type: "reject" }, { reviewer: "이경준", reasonCategory: "타깃 불일치", reasonText: "50대 대상으로 바꿔주세요" }).plan;
  const again = W.transition(rej, { type: "resubmit", newId: "p2" }, { reviewer: "박진영" });
  assert.equal(again.plan.status, "gate1_wait");
  assert.equal(again.plan.parentId, "p1");
  assert.equal(rej.status, "rejected");
  assert.throws(() => W.transition(base(), { type: "resubmit" }, { reviewer: "박진영" }), code("BAD_TRANSITION"));
});

test("결정자 없는 결정은 받지 않는다", () => {
  assert.throws(() => W.transition(base(), { type: "pass" }, {}), code("NO_REVIEWER"));
});

test("업로드 API 호출 코드가 없다", () => {
  const root = path.join(__dirname, "..");
  const files = ["shared/workflow.js", "shared/shared.js", "apps/user/index.html", "apps/admin/index.html"].map(f => path.join(root, f)).filter(fs.existsSync);
  const banned = /(youtube\/v3\/videos\?[^"']*upload|videos\.insert|upload\.youtube|open\.tiktokapis\.com\/v2\/post|\/media_publish|graph\.facebook\.com[^"']*\/videos)/i;
  for (const f of files) assert.ok(!banned.test(fs.readFileSync(f, "utf8")), `${f}에 업로드 API 호출 흔적`);
});

// ---------- 템플릿 규칙 (관리자 화면과 검증 스크립트 공용) ----------
const R = require("../shared/template-rules.js");
const T = require("../shared/templates-data.js");
const ok = () => JSON.parse(JSON.stringify(T[0]));

test("템플릿 규칙: 기본 템플릿 12개는 모두 통과, 12유형 커버", () => {
  for (const t of T) assert.deepEqual(R.validateTemplate(t), [], t.id);
  assert.deepEqual(R.missingTypes(T), []);
});

test("템플릿 규칙: 4·6·8초가 아닌 장면, 15~45초 밖, 마지막이 정보 장면이 아니면 실패", () => {
  let t = ok(); t.scenes[1].seconds = 5;
  assert.ok(R.validateTemplate(t).some(e => e.includes("4·6·8")));
  t = ok(); t.scenes = t.scenes.concat(Array(6).fill({ seconds: 8, role: "detail", source: "photo", text: "x" })).reverse();
  assert.ok(R.validateTemplate(t).some(e => e.includes("총 길이")));
  assert.ok(R.validateTemplate(t).some(e => e.includes("마지막 장면")));
});

test("템플릿 규칙: AI 장면은 '실제 장소 아님' 메모 필수, 실제 장소·정보 장면은 AI 불가", () => {
  let t = ok(); t.scenes[0] = { seconds: 4, role: "hook", source: "ai", text: "x" };
  assert.ok(R.validateTemplate(t).some(e => e.includes("실제 장소·인물 아님")));
  t = ok(); t.scenes[1] = { seconds: 4, role: "place", source: "ai", text: "x", note: "실제 장소 아님" };
  assert.ok(R.validateTemplate(t).some(e => e.includes("AI로 만들 수 없어요")));
});

test("템플릿 규칙: 자막이 안전 영역 글자 수를 넘으면 실패", () => {
  const t = ok(); t.scenes[1].text = "가".repeat(R.MAX_TEXT + 1);
  assert.ok(R.validateTemplate(t).some(e => e.includes("안전 영역")));
});