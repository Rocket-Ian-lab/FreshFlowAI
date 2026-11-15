// 테스트 공용 헬퍼 — 엔진을 '복사'하지 않고 src/FreshFlowAI.jsx 소스에서 직접 읽어 실행한다.
// (문서·테스트의 수치가 실제 제품 코드와 어긋나는 것을 막기 위함. 엔진 코드는 수정하지 않는다.)
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "src", "FreshFlowAI.jsx");

export function loadEngine() {
  const s = fs.readFileSync(SRC, "utf8");
  const cut = (from, to) => {
    const a = s.indexOf(from), b = s.indexOf(to, a);
    if (a < 0 || b < 0) throw new Error(`engine section not found: ${from} … ${to}`);
    return s.slice(a, b);
  };
  const code = [
    cut("const SEGMENTS = [", "// Toss 스타일 토큰"),          // 상수 + lookupBl
    cut("function computeLeadtime", "const riskColor"),         // computeLeadtime · assess · recommend · detectEarlyWarning · suggestOrder · fmtHr
    cut("const FRESH =", "const fmtWon"),                       // 신선도 · 비용 임팩트
  ].join("\n");
  return new Function(`${code}
    return { SEGMENTS, FC_INIT, MOCK_BLS, computeLeadtime, assess, recommend, detectEarlyWarning, suggestOrder, computeFreshnessRisk, computeCostImpact, COST, FRESH };`)();
}

export const NORMAL = { cong: 0.2, cust: 0.2, wx: 0.1, dock: 0.2 };
export const CRISIS = { cong: 0.7, cust: 0.6, wx: 0.4, dock: 0.5 };

// 재현 가능한 난수 (mulberry32)
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function makeCheck() {
  let fails = 0;
  const check = (name, cond, info = "") => { console.log(`${cond ? "✅" : "❌"} ${name}${info ? " — " + info : ""}`); if (!cond) fails++; };
  const done = () => { console.log(fails ? `\n${fails}개 실패` : "\n모든 검증 통과"); process.exit(fails ? 1 : 0); };
  return { check, done };
}
