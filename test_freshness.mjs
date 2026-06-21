// 신선도(상품가치 손실) 위험 로직 검증 — UI 반영 전 수치 확인 (개발원칙 2)
// 모델: 콜드체인 정상 허용일(FRESH_HOLD) 초과분에 대해, 품목 perishability와
// 온도/폭염 리스크(wx)로 가속되는 일일 가치손실률을 누적. 명백한 휴리스틱(시나리오 기반).
const FRESH_HOLD = 2.0;   // 무손실 허용 리드타임(일) — 콜드체인 정상 가정
const BASE_LOSS  = 0.06;  // 일일 기본 가치손실률 (6%/일)
const HEAT_K     = 1.5;   // 폭염/온도 리스크 가속 계수
const CAP        = 0.45;  // 손실률 상한 45%

function computeFreshnessRisk(ltDays, wx, perish = 1.0) {
  const effRate = BASE_LOSS * (1 + wx * HEAT_K);
  const lossPct = Math.min(CAP, Math.max(0, perish * effRate * (ltDays - FRESH_HOLD)));
  const level = lossPct < 0.03 ? "Low" : lossPct < 0.10 ? "Medium" : "High";
  return { lossPct, level, effRate };
}

const NORMAL = { ltDays: 43.3 / 24, wx: 0.1 }; // 1.80일
const CRISIS = { ltDays: 61.8 / 24, wx: 0.4 }; // 2.58일

const cases = [
  ["평소 · 일반품목(perish 1.0)",   NORMAL.ltDays, NORMAL.wx, 1.0],
  ["위기 · 일반품목(perish 1.0)",   CRISIS.ltDays, CRISIS.wx, 1.0],
  ["위기 · 칠레산 체리(perish 2.0)", CRISIS.ltDays, CRISIS.wx, 2.0],
  ["위기 · 미국산 오렌지(perish 0.8)", CRISIS.ltDays, CRISIS.wx, 0.8],
  ["평소 · 칠레산 체리(perish 2.0)", NORMAL.ltDays, NORMAL.wx, 2.0],
];

console.log("리드타임(일) | wx | perish | 손실률 | 등급");
for (const [name, lt, wx, p] of cases) {
  const r = computeFreshnessRisk(lt, wx, p);
  console.log(`${name}: lt=${lt.toFixed(2)} wx=${wx} perish=${p} → ${(r.lossPct * 100).toFixed(1)}% (${r.level})`);
}
