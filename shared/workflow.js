/* AI-이음 — 3번의 확인 상태 전이 (화면·서버 공용 규칙)
 * 브라우저에서는 window.Workflow, Node에서는 module.exports 로 쓴다.
 * 화면 버튼을 막는 것과 별개로, 모든 전이는 반드시 이 함수를 거친다.
 */
(function (root) {
  "use strict";

  const STATUS = ["gate1_wait", "making", "gate2_wait", "gate3_wait", "published", "rejected"];
  const GATE_OF = { gate1_wait: 1, gate2_wait: 2, gate3_wait: 3 };

  const CHECKS2 = [
    { key: "fact",      title: "사실",      desc: "장소명·일정·운영시간이 관광공사 원본과 같다" },
    { key: "date",      title: "날짜",      desc: "행사 기간이 맞고, 역사 추모·기념 기간에 걸리지 않는다" },
    { key: "wording",   title: "표현",      desc: "지역을 낮추거나 왜곡하는 표현·이미지가 없다" },
    { key: "copyright", title: "저작권",    desc: "사진 이용조건을 지켰다 (변경 금지 사진은 원본 비율 그대로), 음원은 사용 가능한 것만" },
    { key: "realplace", title: "실제 장소", desc: "실제 장소를 AI로 새로 그리지 않았다" },
    { key: "label",     title: "표시",      desc: "영상 안에 'AI 활용' 표시와 자막이 있다" }
  ];
  const CHECKS3 = [
    { key: "final",   title: "최종 영상", desc: "2차에서 고른 장면으로 합쳐진 영상을 끝까지 봤다" },
    { key: "caption", title: "게시 정보", desc: "제목·설명에 출처와 'AI 활용'을 적었다" }
  ];
  const REJECT_REASONS = ["조합 어색", "사실 오류", "표현 부적절", "저작권·이용조건", "타깃 불일치", "기타"];
  const PICKS = ["veo", "kling", "regen"];

  class WorkflowError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  }
  const fail = (code, msg) => { throw new WorkflowError(code, msg); };

  /* 2차 통과 가능 여부 — 화면 안내 문구와 서버 검사에 같은 결과를 쓴다 */
  function gate2Blockers(plan, ctx) {
    const out = [];
    const opts = Object.assign({ forbidSelfReview: true }, ctx && ctx.settings);
    if (opts.forbidSelfReview && ctx && ctx.reviewer === plan.requestedBy)
      out.push({ code: "SELF_REVIEW", text: `요청자(${plan.requestedBy})는 2차 확인을 할 수 없어요` });
    const scenes = plan.scenes || [];
    const picks = (ctx && ctx.scenePicks) || {};
    const missing = scenes.filter(s => !PICKS.includes(picks[s.idx])).length;
    if (!scenes.length) out.push({ code: "NO_SCENES", text: "장면 초안이 없어요" });
    else if (missing) out.push({ code: "SCENES_MISSING", text: `장면 ${missing}개를 더 골라야 해요` });
    const cl = (ctx && ctx.checklist) || {};
    const unchecked = CHECKS2.filter(c => cl[c.key] !== true).length;
    if (unchecked) out.push({ code: "CHECKLIST_MISSING", text: `점검표 ${unchecked}개가 남았어요` });
    return out;
  }
  function gate3Blockers(plan, ctx) {
    const cl = (ctx && ctx.checklist) || {};
    const unchecked = CHECKS3.filter(c => cl[c.key] !== true).length;
    return unchecked ? [{ code: "CHECKLIST_MISSING", text: `확인 ${unchecked}개가 남았어요` }] : [];
  }

  /**
   * 결정 하나를 적용한다. plan·logs를 직접 바꾸지 않고 새 객체를 돌려준다.
   * @param plan    ContentPlan
   * @param action  { type: "pass" | "reject" | "draftReady" | "resubmit", ... }
   * @param ctx     { reviewer, at, checklist?, scenePicks?, reasonCategory?, reasonText?, uploadUrl?, settings? }
   * @returns { plan, log }   log는 review_logs에 추가할 한 줄 (draftReady는 시스템 기록)
   */
  function transition(plan, action, ctx) {
    ctx = ctx || {};
    if (!plan || !STATUS.includes(plan.status)) fail("BAD_STATE", "알 수 없는 상태예요");
    if (!ctx.reviewer) fail("NO_REVIEWER", "누가 결정했는지 알 수 없어요");
    const at = ctx.at || new Date().toISOString();
    const next = Object.assign({}, plan);

    if (action.type === "draftReady") {
      if (plan.status !== "making") fail("BAD_TRANSITION", "초안을 만드는 중인 항목만 완료로 바꿀 수 있어요");
      if (!action.scenes || !action.scenes.length) fail("NO_SCENES", "장면 초안이 없어요");
      next.status = "gate2_wait";
      next.scenes = action.scenes.map(s => Object.assign({}, s, { picked: undefined }));
      return { plan: next, log: { planId: plan.id, kind: "system", reviewer: ctx.reviewer, at, note: "초안 생성 완료 (장면별 Veo·Kling 후보)" } };
    }

    if (action.type === "resubmit") {
      if (plan.status !== "rejected") fail("BAD_TRANSITION", "반려된 항목만 다시 요청할 수 있어요");
      // 기존 기록은 그대로 두고, 새 요청을 새 id로 만든다
      const fresh = Object.assign({}, plan, {
        id: action.newId || plan.id + "-r", status: "gate1_wait", parentId: plan.id,
        requestedBy: ctx.reviewer, scenes: undefined
      });
      return { plan: fresh, log: { planId: fresh.id, kind: "request", gate: 1, reviewer: ctx.reviewer, at, note: `반려 사유 반영 후 다시 요청 (이전 ${plan.id})` } };
    }

    const gate = GATE_OF[plan.status];
    if (!gate) fail("BAD_TRANSITION", "지금은 확인할 단계가 아니에요");
    if (action.gate && action.gate !== gate) fail("GATE_SKIP", `지금은 ${gate}차 확인 단계예요`);

    const log = { planId: plan.id, kind: "decision", gate, reviewer: ctx.reviewer, at };

    if (action.type === "reject") {
      if (!REJECT_REASONS.includes(ctx.reasonCategory)) fail("NO_REASON_CATEGORY", "반려 사유 분류를 골라주세요");
      if (!ctx.reasonText || !String(ctx.reasonText).trim()) fail("NO_REASON_TEXT", "반려 상세 사유를 적어주세요");
      next.status = "rejected";
      Object.assign(log, { decision: "reject", reasonCategory: ctx.reasonCategory, reasonText: String(ctx.reasonText).trim() });
      return { plan: next, log };
    }

    if (action.type !== "pass") fail("BAD_ACTION", "알 수 없는 결정이에요");

    if (gate === 1) {
      next.status = "making";
    } else if (gate === 2) {
      const b = gate2Blockers(plan, ctx);
      if (b.length) fail(b[0].code, b.map(x => x.text).join(" · "));
      next.status = "gate3_wait";
      next.scenes = plan.scenes.map(s => Object.assign({}, s, { picked: ctx.scenePicks[s.idx] }));
      Object.assign(log, { checklist: Object.assign({}, ctx.checklist), scenePicks: Object.assign({}, ctx.scenePicks) });
    } else {
      const b = gate3Blockers(plan, ctx);
      if (b.length) fail(b[0].code, b[0].text);
      next.status = "published";
      if (ctx.uploadUrl) next.uploadUrl = ctx.uploadUrl;
      Object.assign(log, { checklist: Object.assign({}, ctx.checklist), uploadUrl: ctx.uploadUrl || undefined });
    }
    log.decision = "pass";
    return { plan: next, log };
  }

  const api = { STATUS, CHECKS2, CHECKS3, REJECT_REASONS, PICKS, WorkflowError, transition, gate2Blockers, gate3Blockers };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Workflow = api;
})(typeof window !== "undefined" ? window : globalThis);
