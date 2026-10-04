// 가짜 공용 DB — Supabase REST(PostgREST)의 아주 작은 흉내. 로컬 개발·테스트 전용, 메모리에만 저장.
// supabase/schema.sql의 규칙 중 핵심 두 가지를 똑같이 지킨다:
//   1) review_logs는 추가만 (수정·삭제·같은 id 다시 넣기 거부)
//   2) content_plans의 상태는 정해진 순서로만 바뀜 (1차를 건너뛸 수 없음)
import http from "node:http";

const PK = { app_config: "key", content_plans: "id", review_logs: "id", chat_threads: "id" };
const NEXT = { gate1_wait: ["making", "rejected"], making: ["gate2_wait"], gate2_wait: ["gate3_wait", "rejected"], gate3_wait: ["published", "rejected"] };

export function startMockDb(port) {
  const tables = Object.fromEntries(Object.keys(PK).map(t => [t, new Map()]));
  const send = (res, code, body) => {
    res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey, authorization, content-type, prefer", "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS" });
    res.end(body === undefined ? "" : JSON.stringify(body));
  };
  const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") return send(res, 204);
    const url = new URL(req.url, "http://x");
    const table = url.pathname.replace(/^\/rest\/v1\//, "");
    if (!PK[table]) return send(res, 404, { message: `없는 표: ${table}` });
    const rows = tables[table], pk = PK[table];
    if (req.method === "GET") return send(res, 200, [...rows.values()]);
    if (req.method === "DELETE") {
      if (table !== "app_config") return send(res, 403, { message: "기록은 지울 수 없어요" });
      const [k, v] = [...url.searchParams.entries()][0] || [];
      if (k === pk && v && v.startsWith("eq.")) rows.delete(v.slice(3));
      return send(res, 204);
    }
    if (req.method === "POST") {
      let body = ""; for await (const c of req) body += c;
      let list; try { list = JSON.parse(body); } catch { return send(res, 400, { message: "JSON이 아니에요" }); }
      list = Array.isArray(list) ? list : [list];
      const upsert = /merge-duplicates/.test(req.headers.prefer || "");
      for (const r of list) {
        const old = rows.get(r[pk]);
        if (old && table === "review_logs") return send(res, 409, { message: "결정 기록은 수정할 수 없어요" });
        if (old && !upsert) return send(res, 409, { message: "이미 있는 id" });
        if (old && table === "content_plans" && old.status !== r.status && !(NEXT[old.status] || []).includes(r.status))
          return send(res, 400, { message: `허용되지 않는 상태 변경: ${old.status} → ${r.status}` });
        if (table === "review_logs" && !tables.content_plans.has(r.plan_id)) return send(res, 409, { message: "없는 콘텐츠의 기록" });
      }
      for (const r of list) rows.set(r[pk], Object.assign({}, rows.get(r[pk]), r));
      return send(res, 201);
    }
    send(res, 405, { message: "지원하지 않는 요청" });
  });
  server.listen(port, "127.0.0.1");
  return server;
}
