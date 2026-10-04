/* AI-이음 — 템플릿 규칙 (관리자 화면의 실시간 검사 · scripts/validate-templates.mjs 공용)
 * 브라우저에서는 window.TemplateRules, Node에서는 module.exports
 */
(function (root) {
  "use strict";
  const CATS = ["축제", "관광지", "음식", "문화"];
  const AGES = ["20대", "30~40대", "50대 이상"]; // 경계는 팀 확인 전 임시
  const SECONDS = [4, 6, 8];                       // Veo 지원 길이
  const SOURCES = ["photo", "ai", "archive", "text"];
  const HOOKS = ["question", "countdown", "pov", "reveal", "list", "seasonal", "sensory", "story", "quiz", "howto", "nostalgia", "quote"];
  // 통합 안전 영역(1080×1920 중 x 65~888, y 288~1248 — docs/references.md 2장) 폭에서 자막 2~3줄
  const MAX_TEXT = 24;
  const MAX_INFO = 40;                             // 정보 카드는 작은 글씨 3줄까지
  const TOTAL_MIN = 15, TOTAL_MAX = 45;

  /** 템플릿 하나를 검사해 오류 문장 목록을 돌려준다. opts.anchors(Set)가 있으면 참고 문서 앵커도 검사 */
  function validateTemplate(t, opts) {
    const e = [];
    if (!t || typeof t !== "object") return ["템플릿 형식이 아니에요"];
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id || "")) e.push("id는 영문 소문자-하이픈 형식이어야 해요");
    if (!t.name) e.push("이름이 비어 있어요");
    if (!t.description) e.push("설명이 비어 있어요");
    if (!Array.isArray(t.categories) || !t.categories.length || t.categories.some(c => !CATS.includes(c))) e.push("분야를 하나 이상 골라주세요");
    if (!Array.isArray(t.ages) || !t.ages.length || t.ages.some(a => !AGES.includes(a))) e.push("연령을 하나 이상 골라주세요");
    if (!t.hook || !HOOKS.includes(t.hook.type)) e.push("훅 방식을 골라주세요");
    if (!t.hook || !t.hook.example) e.push("훅 예시 문구가 비어 있어요");
    else if (t.hook.example.length > MAX_TEXT) e.push(`훅 문구가 ${MAX_TEXT}자를 넘어 안전 영역을 벗어나요`);

    const sc = Array.isArray(t.scenes) ? t.scenes : [];
    if (sc.length < 3) e.push("장면은 3개 이상이어야 해요");
    sc.forEach((s, i) => {
      const at = `장면 ${i + 1}`;
      if (!SECONDS.includes(Number(s.seconds))) e.push(`${at}: 길이는 4·6·8초만 돼요`);
      if (!SOURCES.includes(s.source)) e.push(`${at}: 재료를 골라주세요`);
      if (!s.role) e.push(`${at}: 역할이 비어 있어요`);
      const lim = s.role === "info" ? MAX_INFO : MAX_TEXT;
      if (s.text != null && String(s.text).length > lim) e.push(`${at}: 자막이 ${lim}자를 넘어 안전 영역을 벗어나요`);
      if (s.source === "ai" && !/실제/.test(s.note || "")) e.push(`${at}: AI 장면은 메모에 '실제 장소·인물 아님'을 적어야 해요`);
      if (s.source === "ai" && ["spot", "info", "food", "place", "reveal"].includes(s.role)) e.push(`${at}: 실제 장소·음식 장면은 AI로 만들 수 없어요`);
    });
    const total = sc.reduce((a, s) => a + (Number(s.seconds) || 0), 0);
    if (sc.length && (total < TOTAL_MIN || total > TOTAL_MAX)) e.push(`총 길이는 ${TOTAL_MIN}~${TOTAL_MAX}초여야 해요 (지금 ${total}초)`);
    const last = sc[sc.length - 1];
    if (last && last.role !== "info") e.push("마지막 장면은 정보 장면(위치·기간·운영시간)이어야 해요");
    if (last && last.source === "ai") e.push("마지막 정보 장면은 AI로 만들 수 없어요");

    if (!Array.isArray(t.references) || !t.references.length) e.push("참고 레퍼런스가 비어 있어요");
    if (opts && opts.anchors) for (const r of t.references || []) {
      const a = String(r).split("#")[1];
      if (!a || !opts.anchors.has(a)) e.push(`references.md에 없는 앵커: ${r}`);
    }
    if (t.inspiredBy && t.inspiredBy.length !== (t.references || []).length) e.push("inspiredBy와 references 개수가 달라요");
    return e;
  }

  /** 분야×연령 12유형 중 템플릿이 없는 유형 */
  function missingTypes(list) {
    const out = [];
    for (const c of CATS) for (const a of AGES)
      if (!list.some(t => (t.categories || []).includes(c) && (t.ages || []).includes(a))) out.push(`${c}×${a}`);
    return out;
  }
  const totalSeconds = t => (t.scenes || []).reduce((a, s) => a + (Number(s.seconds) || 0), 0);

  const api = { CATS, AGES, SECONDS, SOURCES, HOOKS, MAX_TEXT, MAX_INFO, TOTAL_MIN, TOTAL_MAX, validateTemplate, missingTypes, totalSeconds };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TemplateRules = api;
})(typeof window !== "undefined" ? window : globalThis);
