// Vercel 서버리스 함수 — Claude API 프록시.
// 로컬은 server.js(Express)가, 배포(Vercel)는 이 함수가 /api/messages를 처리한다.
// ANTHROPIC_API_KEY는 Vercel 프로젝트 환경변수로 주입 (레포에 키를 넣지 않는다).
// 키가 없으면 503 → 프론트는 규칙기반 진단으로 폴백(데모 안 멈춤).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST만 허용됩니다." });
    return;
  }
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) {
    res.status(503).json({ error: "ANTHROPIC_API_KEY 미설정 — Vercel 환경변수에 추가하세요." });
    return;
  }
  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: `프록시 중계 실패: ${String(e)}` });
  }
}
