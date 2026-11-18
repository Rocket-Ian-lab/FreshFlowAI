// 영한 전환(i18n) 검증 — 표시 계층이 엔진 출력을 빠짐없이 영문으로 바꾸는지, 엔진 수치는 그대로인지 확인한다.
import fs from "node:fs";
import { loadEngine, NORMAL, CRISIS, makeCheck } from "./test_helpers.mjs";
import { trName, trAction, trRationale, withKoKeywords, SENSE_SAMPLES_EN, trHr, fmtBigWon } from "./src/i18n.js";

const { check, done } = makeCheck();
const E = loadEngine();
const hasKo = (s) => /[가-힣]/.test(s);

// keywordSense는 loadEngine 범위 밖이므로 소스에서 직접 잘라 실행(엔진 코드는 수정하지 않는다)
const src = fs.readFileSync(new URL("./src/FreshFlowAI.jsx", import.meta.url), "utf8");
const a = src.indexOf("const SENSE_SAMPLES ="), b = src.indexOf("const senseColor", a);
const { keywordSense, SENSE_SAMPLES } = new Function(`${src.slice(a, b)}\nreturn { keywordSense, SENSE_SAMPLES };`)();

// 1) 엔진 상수의 이름이 전부 영문으로 바뀌는가
const names = [
  ...E.SEGMENTS.flatMap((s) => [s.name, s.src, s.srcDesc]),
  ...E.FC_INIT.map((f) => f.name),
  ...E.MOCK_BLS.flatMap((x) => [x.item, x.origin, x.pod, x.note]),
  "항만 혼잡도", "통관·검역 리스크", "기상 리스크", "FC Dock 혼잡", "실시간", "준실시간", "추정", "규칙기반 폴백", "AI (Claude) 분석",
];
const left = names.filter((n) => hasKo(trName("en", n)));
check("엔진 상수 이름 영문화 누락 없음", left.length === 0, left.length ? `누락: ${left.join(" / ")}` : `${names.length}개`);
check("한국어 모드에서는 원문 그대로", names.every((n) => trName("ko", n) === n));

// 2) recommend()가 만드는 조치 문장 3종
const lt = E.computeLeadtime(CRISIS).total / 24;
const crisisActs = E.recommend(E.FC_INIT, lt, 4000).actions;
check("위기·4000개 조치 영문화", crisisActs.every((s) => !hasKo(trAction("en", s))), trAction("en", crisisActs[0]));
check("수량은 그대로(인천 1,559 · 용인 2,441)", trAction("en", crisisActs[0]).includes("1,559") && trAction("en", crisisActs[1]).includes("2,441"));
const all = new Set();
for (const risk of [NORMAL, CRISIS, { cong: 1, cust: 1, wx: 1, dock: 1 }])
  for (const vol of [0, 500, 1500, 4000, 8000])
    E.recommend(E.FC_INIT, E.computeLeadtime(risk).total / 24, vol).actions.forEach((s) => all.add(s));
const kinds = ["신규 선적", "잔여 물량", "재고 이관"].filter((k) => [...all].some((s) => s.startsWith(k)));
const missed = [...all].filter((s) => hasKo(trAction("en", s)));
check("조치 문장 유형 3종 모두 영문화", missed.length === 0 && kinds.length === 3, `유형 ${kinds.length}종 · 문장 ${all.size}개`);
check("한국어 모드 조치 문장 불변", crisisActs.every((s) => trAction("ko", s) === s));

// 3) 리스크 센싱 폴백: 영문 텍스트도 규칙이 읽는가 / 한국어 결과는 그대로인가
const koCrisis = keywordSense(SENSE_SAMPLES.crisis), koPeace = keywordSense(SENSE_SAMPLES.peace);
check("한국어 텍스트는 보강해도 결과 동일", JSON.stringify(keywordSense(withKoKeywords(SENSE_SAMPLES.crisis))) === JSON.stringify(koCrisis)
  && JSON.stringify(keywordSense(withKoKeywords(SENSE_SAMPLES.peace))) === JSON.stringify(koPeace));
const enCrisis = keywordSense(withKoKeywords(SENSE_SAMPLES_EN.crisis)), enPeace = keywordSense(withKoKeywords(SENSE_SAMPLES_EN.peace));
check("영문 평시 예시 → 전 항목 평시(0.12)", Object.values(enPeace.risks).every((v) => v === 0.12), JSON.stringify(enPeace.risks));
check("영문 위기 예시 → 한국어 위기 예시와 같은 리스크", JSON.stringify(enCrisis.risks) === JSON.stringify(koCrisis.risks),
  `EN ${JSON.stringify(enCrisis.risks)} / KO ${JSON.stringify(koCrisis.risks)}`);
check("폴백 근거 문장 영문화", Object.values(koCrisis.rationale).concat(Object.values(koPeace.rationale)).every((r) => !hasKo(trRationale("en", r))),
  trRationale("en", koCrisis.rationale.cong));
check("폴백 ETA 근거·출처 영문화", !hasKo(trName("en", koCrisis.eta.basis)) && !hasKo(trName("en", koCrisis.source)));

// 4) 시각·금액 표기
const o = E.suggestOrder(E.FC_INIT[1], lt);
const fmtHr = new Function(`${src.slice(src.indexOf("function fmtHr"), src.indexOf("const riskColor"))}\nreturn fmtHr;`)();
check("시각 꼬리표 영문화", !hasKo(trHr("en", fmtHr(33))) && !hasKo(trHr("en", fmtHr(o.orderByHr))), `${fmtHr(33)} → ${trHr("en", fmtHr(33))}`);
check("금액 큰 숫자", fmtBigWon("ko", 28824000) === "2,882만원" && fmtBigWon("en", 28824000) === "₩28.8M");

done();
