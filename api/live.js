// Vercel 서버리스 함수 — 실데이터 어댑터 엔드포인트 (GET /api/live?bl=...)
// 공공 API 키(DATA_GO_KR_KEY, UNIPASS_KEY)는 Vercel 환경변수로 주입. 브라우저 CORS/키 노출 회피.
import { getLive } from "../lib/live.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.status(405).json({ error: "GET만 허용됩니다." }); return; }
  const bl = String(req.query?.bl || "").trim();
  try {
    const data = await getLive(process.env, { bl });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: `실데이터 조회 실패: ${String(e?.message || e)}` });
  }
}
