import { createContext, useContext } from "react";

/* 영한 전환(i18n) — 표시 계층 전용.
   엔진(FreshFlowAI.jsx의 계산 함수·상수)은 한국어 문자열을 그대로 만든다. 이 모듈은 그 결과를
   '화면에 그릴 때만' 영문으로 바꾼다. 엔진 함수·수치는 건드리지 않는다(CLAUDE.md 섹션 9 회귀값 유지). */

export const LangContext = createContext("ko");

export function useLang() {
  const lang = useContext(LangContext);
  const en = lang === "en";
  return { lang, en, L: (ko, enText) => (en ? enText : ko) };
}

// 초기 언어: ?lang=en|ko → 저장된 선택 → 한국어
export function initialLang() {
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (q === "en" || q === "ko") return q;
    const saved = window.localStorage.getItem("ff-lang");
    if (saved === "en" || saved === "ko") return saved;
  } catch (e) { /* 저장소 접근 불가 시 기본값 */ }
  return "ko";
}
export function saveLang(lang) {
  try { window.localStorage.setItem("ff-lang", lang); } catch (e) { /* 무시 */ }
}

// 엔진 상수·서버 응답이 만드는 고정 문자열 → 영문
const NAMES = {
  // 리드타임 구간
  "항만 대기·하역": "Port wait & unloading",
  "통관·검역": "Customs & quarantine",
  "컨테이너 반출": "Container release",
  "냉장 내륙운송": "Reefer inland haul",
  "FC 입고 대기": "FC dock wait",
  // 리스크
  "항만 혼잡도": "Port congestion",
  "통관·검역 리스크": "Customs & quarantine risk",
  "기상 리스크": "Weather risk",
  "FC Dock 혼잡": "FC dock congestion",
  // FC
  "인천 FC": "Incheon FC", "김포 FC": "Gimpo FC", "용인 FC": "Yongin FC", "안성 FC": "Anseong FC",
  // 화물
  "칠레산 체리": "Chilean cherries", "노르웨이 연어": "Norwegian salmon",
  "베트남 생망고": "Vietnamese fresh mango", "미국산 오렌지": "US oranges",
  "발파라이소": "Valparaíso", "오슬로": "Oslo", "호치민": "Ho Chi Minh City", "롱비치": "Long Beach", "인천항": "Port of Incheon",
  "검역 집중관리 품목 · 태풍 영향권 (위기 시나리오)": "Quarantine watch-list item · in the typhoon path (crisis scenario)",
  "통관 완료 · 정상 흐름 (평소 시나리오)": "Customs cleared · normal flow (normal scenario)",
  "항만 혼잡 · 접안 대기 중": "Port congestion · waiting for a berth",
  "검역 서류 보완 요청 이력": "History of quarantine document re-submission requests",
  // 데이터 출처
  "실시간": "Live", "준실시간": "Near-live", "추정": "Estimated",
  "UNI-PASS · 식약처": "UNI-PASS · MFDS",
  "UNI-PASS 반출상태": "UNI-PASS release status",
  "운송사 TMS(Phase2)": "Carrier TMS (Phase 2)",
  "자사 WMS Dock": "In-house WMS dock",
  "해수부 Port-MIS 선박입항·관제정보 공공 API + AIS 선박위치로 접안 대기 추적":
    "Ministry of Oceans and Fisheries Port-MIS vessel arrival & traffic public API + AIS vessel positions to track berth waiting",
  "관세청 UNI-PASS 화물통관진행정보 API(진행단계·처리일시) + 식약처 수입식품정보마루·UNI-PASS 검사검역(수입 검사·부적합 이력)":
    "Korea Customs Service UNI-PASS cargo clearance progress API (stage, timestamps) + MFDS (Ministry of Food and Drug Safety) imported-food portal and UNI-PASS inspection/quarantine records",
  "UNI-PASS 물품반출 상태값. 보세창고 시스템 연동 정도에 따라 지연 가능":
    "UNI-PASS release status. May lag depending on how tightly the bonded warehouse system is integrated",
  "운송사 GPS/TMS 연동 필요. 표준화 미비로 Phase 2 과제. MVP는 과거 평균+도로교통 추정":
    "Requires carrier GPS/TMS integration. Not standardized, so a Phase 2 item. The MVP estimates from historical averages and road traffic",
  "자사 FC의 WMS Dock 예약·입고 데이터. 자사 시스템이면 완전 실시간":
    "Dock appointment and receiving data from the company's own WMS. Fully real-time when it is an in-house system",
  // /api/live 출처명
  "해수부 Port-MIS (항만)": "Ministry of Oceans and Fisheries Port-MIS (port)",
  "관세청 UNI-PASS 화물통관진행정보": "Korea Customs Service UNI-PASS cargo clearance progress",
  "기상청 초단기실황·기상특보 (공공데이터포털)": "Korea Meteorological Administration nowcast & weather advisories (data.go.kr)",
  // /api/live 고정 안내문
  "DATA_GO_KR_KEY 미설정 — 시뮬레이션 값 유지": "DATA_GO_KR_KEY not set — simulated value kept",
  "UNIPASS_KEY 미설정 — 시뮬레이션 값 유지": "UNIPASS_KEY not set — simulated value kept",
  "Port-MIS 데이터셋 키/엔드포인트 설정 필요 — 시뮬레이션 값 유지": "Port-MIS dataset key/endpoint required — simulated value kept",
  "자사 WMS 연동 필요 — 시뮬레이션 값 유지": "In-house WMS integration required — simulated value kept",
  "조회할 BL이 없습니다 — ⓪에서 BL을 선택하세요": "No BL to look up — select a BL in ⓪",
  "UNI-PASS에 해당 BL/화물관리번호 없음": "BL / cargo control number not found in UNI-PASS",
  // 리스크 센싱(규칙기반 폴백)
  "특이 신호 없음(평시)": "No unusual signal (normal)",
  "통관 리스크 기반 추정(규칙)": "estimated from customs risk (rule-based)",
  "규칙기반 폴백": "Rule-based fallback",
  "AI (Claude) 분석": "AI (Claude) analysis",
  "AI 추정": "AI estimate",
};
export const trName = (lang, s) => (lang === "en" && NAMES[s]) || s;

// recommend()가 만드는 조치 문장 → 영문
export function trAction(lang, s) {
  if (lang !== "en") return s;
  let m;
  if ((m = s.match(/^신규 선적 → (.+): ([\d,]+)개 우선배정$/))) return `New shipment → ${trName(lang, m[1])}: ${m[2]} units (priority allocation)`;
  if ((m = s.match(/^잔여 물량 → (.+): ([\d,]+)개$/))) return `Remaining volume → ${trName(lang, m[1])}: ${m[2]} units`;
  if ((m = s.match(/^재고 이관: (.+) → (.+) ([\d,]+)개$/))) return `Stock transfer: ${trName(lang, m[1])} → ${trName(lang, m[2])}, ${m[3]} units`;
  return s;
}

// keywordSense()의 감지 키워드 ↔ 영문
const KW = {
  "태풍": "typhoon", "파업": "strike", "혼잡": "congestion", "적체": "backlog", "접안": "berthing", "대기": "waiting",
  "강풍": "strong wind", "풍랑": "high seas", "정밀검사": "detailed inspection", "검역": "quarantine", "불합격": "rejection",
  "서류": "documents", "보완": "re-submission", "통관 지연": "customs delay", "표본": "sampling", "강화": "tightening",
  "폭염": "heat wave", "한파": "cold wave", "호우": "heavy rain", "특보": "weather advisory",
  "입고 지연": "inbound delay", "도크": "dock", "물량": "volume", "폭주": "surge", "적재": "loading",
};
export function trRationale(lang, s) {
  if (lang !== "en" || !s) return s;
  const m = s.match(/^'(.+)' 감지$/);
  if (m) return `Detected: ${m[1].split("·").map((k) => KW[k] || k).join(", ")}`;
  return trName(lang, s);
}

// 영문 텍스트도 규칙기반 폴백이 읽을 수 있게, 감지된 영문 표현의 한국어 키워드를 뒤에 덧붙인다.
// keywordSense()는 그대로 두고 입력만 보강한다(한국어 텍스트에는 영향 없음).
const EN_TO_KO = [
  [/typhoon/i, "태풍"], [/strike/i, "파업"], [/congest/i, "혼잡"], [/backlog/i, "적체"], [/berth/i, "접안"],
  [/\bwait|queue/i, "대기"], [/strong wind|gale/i, "강풍"], [/high seas|rough sea/i, "풍랑"],
  [/detailed[- ]inspection|intensive inspection/i, "정밀검사"], [/quarantine/i, "검역"], [/reject|non-?complian/i, "불합격"],
  [/document|paperwork/i, "서류"], [/re-?submi|supplement/i, "보완"], [/customs delay/i, "통관 지연"],
  [/sampling/i, "표본"], [/tighten|stricter/i, "강화"], [/heat ?wave/i, "폭염"], [/cold ?wave/i, "한파"],
  [/heavy rain|downpour/i, "호우"], [/advisory|weather warning|weather alert/i, "특보"],
  [/inbound delay|receiving delay/i, "입고 지연"], [/\bdock/i, "도크"], [/volume/i, "물량"], [/surge/i, "폭주"], [/\bloading/i, "적재"],
];
export function withKoKeywords(text) {
  const t = text || "";
  const add = EN_TO_KO.filter(([re]) => re.test(t)).map(([, ko]) => ko);
  return add.length ? `${t} ${add.join(" ")}` : t;
}

// 리스크 센싱 예시 텍스트(영문). 한국어 예시는 FreshFlowAI.jsx의 SENSE_SAMPLES.
export const SENSE_SAMPLES_EN = {
  peace: "Port of Incheon operating normally. No notable weather. Chilean cherries in routine customs clearance. FC receiving on schedule.",
  crisis: "Typhoon Khanun is moving north, worsening berth waiting and congestion at the Port of Incheon. Korea Customs Service raised the detailed-inspection rate for quarantine of Chilean cherries (more document re-submission requests). Heat wave advisory for the Seoul metro area. A holiday volume surge is causing FC dock inbound delays.",
};

// fmtHr()의 날짜 꼬리표 → 영문
export const trHr = (lang, s) => (lang === "en" ? s.replace("(익일)", "(D+1)") : s);

// 금액 큰 숫자: 한국어 '2,882만원' / 영문 '₩28.8M'
export const fmtBigWon = (lang, w) =>
  lang === "en" ? `₩${(w / 1e6).toFixed(1)}M` : `${Math.round(w / 10000).toLocaleString()}만원`;
