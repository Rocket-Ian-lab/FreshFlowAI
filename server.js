// FreshFlow AI — Claude API 프록시 (로컬 데모용)
// 아티팩트 밖에서는 브라우저가 api.anthropic.com을 직접 못 부른다(CORS·키 노출).
// 이 프록시가 ANTHROPIC_API_KEY를 서버측에서 주입해 중계한다.
// 키가 없으면 503을 돌려주고, 프론트는 규칙기반 진단으로 폴백한다(데모 안 멈춤).
import express from "express";
import dotenv from "dotenv";
import { getLive } from "./lib/live.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PROXY_PORT || 8787;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true, hasKey: Boolean(KEY),
    live: { dataGoKr: Boolean(process.env.DATA_GO_KR_KEY), unipass: Boolean(process.env.UNIPASS_KEY) },
  });
});

// 실데이터 어댑터: 기상청(인천 실황·특보) + UNI-PASS(BL 통관진행) → 엔진 리스크 입력
app.get("/api/live", async (req, res) => {
  const bl = String(req.query.bl || "").trim();
  try {
    const data = await getLive(process.env, { bl });
    res.set("Cache-Control", "no-store").json(data);
  } catch (e) {
    res.status(500).json({ error: `실데이터 조회 실패: ${String(e?.message || e)}` });
  }
});

app.post("/api/messages", async (req, res) => {
  if (!KEY) {
    return res.status(503).json({
      error: "ANTHROPIC_API_KEY 미설정 — .env에 키를 넣고 서버를 재시작하세요.",
    });
  }
  try {
    const upstream = await fetch(ANTHROPIC_URL, {
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
});

app.listen(PORT, () => {
  console.log(`[proxy] http://localhost:${PORT}  (API key ${KEY ? "loaded ✓" : "MISSING ✗ — 규칙기반 폴백만 동작"})`);
});
