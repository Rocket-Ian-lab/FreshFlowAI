// AI 리스크 센싱 폴백(규칙기반) 검증 — LLM 실패/무키 시에도 데모가 동작하도록.
// 실제 데모는 Claude가 비정형 텍스트→리스크 JSON을 도출하고, 이건 그 폴백이자 테스트 기준.
const SENSE_RULES = {
  cong: [["태풍", 0.35], ["파업", 0.4], ["혼잡", 0.25], ["적체", 0.3], ["접안", 0.2], ["대기", 0.15], ["강풍", 0.2], ["풍랑", 0.2]],
  cust: [["정밀검사", 0.4], ["검역", 0.25], ["불합격", 0.35], ["서류", 0.2], ["보완", 0.2], ["통관 지연", 0.3], ["표본", 0.2], ["강화", 0.2]],
  wx:   [["태풍", 0.4], ["폭염", 0.35], ["한파", 0.3], ["강풍", 0.25], ["풍랑", 0.25], ["호우", 0.3], ["특보", 0.2]],
  dock: [["입고 지연", 0.35], ["도크", 0.3], ["물량", 0.2], ["폭주", 0.3], ["적재", 0.2]],
};
function keywordSense(text) {
  const t = text || "";
  const risks = {}, rationale = {};
  for (const k of ["cong", "cust", "wx", "dock"]) {
    let best = 0; const hits = [];
    for (const [kw, w] of SENSE_RULES[k]) { if (t.includes(kw)) { hits.push(kw); if (w > best) best = w; } }
    const score = 0.12 + (hits.length ? best + 0.04 * (hits.length - 1) : 0);
    risks[k] = Math.min(1, Math.round(score * 100) / 100);
    rationale[k] = hits.length ? `'${hits.join("·")}' 감지` : "특이 신호 없음(평시)";
  }
  const base = 12;
  const p50 = Math.round(base * (1 + risks.cust * 1.5) * 10) / 10;
  const p90 = Math.round(p50 * 1.4 * 10) / 10;
  return { risks, rationale, eta: { p50, p90, basis: "통관 리스크 기반 추정(규칙)" }, source: "규칙기반 폴백" };
}

const PEACE = "인천항 정상 운영 중. 기상 특이사항 없음. 칠레산 체리 일반 통관 진행. FC 입고 정상.";
const CRISIS = "태풍 '카눈' 북상으로 인천항 접안 대기·혼잡 가중. 관세청, 칠레산 체리 검역 정밀검사 비율 상향(서류 보완 요청 증가). 수도권 폭염 특보. 명절 물량 폭주로 FC 도크 입고 지연.";

for (const [name, txt] of [["평시", PEACE], ["위기", CRISIS]]) {
  const r = keywordSense(txt);
  console.log(`\n[${name}] cong ${r.risks.cong} cust ${r.risks.cust} wx ${r.risks.wx} dock ${r.risks.dock}`);
  console.log(`  통관 ETA P50 ${r.eta.p50}h / P90 ${r.eta.p90}h`);
  for (const k of ["cong", "cust", "wx", "dock"]) console.log(`  ${k}: ${r.rationale[k]}`);
}
