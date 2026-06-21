import React, { useState, useMemo, useEffect, useRef } from "react";

/* ============================================================
   FreshFlow AI — 콜드체인 Port-to-FC 관제탑
   수입 신선식품의 항만 도착 → 통관·검역 → 냉장 내륙운송 → FC 입고
   End-to-End 리드타임을 예측하고, FC별 결품 위험을 진단해
   신규 선적 선제배치로 해소하는 의사결정 Copilot.

   핵심 가치: "선박이 언제 도착하는가"가 아니라
              "언제 FC에 입고되어 판매가능 재고가 되는가"
   하이라이트: 리드타임 5구간 중 "어디서 새는가" 시각화
   ============================================================ */

// ── 리드타임 5구간 (검증된 사양) ─────────────────────────────
// base = 정상 소요시간(hr), drivers = {리스크키: 민감도}
// source = 데이터 가용성: live(실시간) / semi(준실시간) / est(추정), src=출처
// srcDesc = 출처 상세 (툴팁/심사 답변용)
const SEGMENTS = [
  { key: "port",    name: "항만 대기·하역", base: 8,  drivers: { cong: 1.2, wx: 0.6 }, source: "live", src: "Port-MIS · AIS",
    srcDesc: "해수부 Port-MIS 선박입항·관제정보 공공 API + AIS 선박위치로 접안 대기 추적" },
  { key: "customs", name: "통관·검역",      base: 12, drivers: { cust: 1.5, wx: 0.2 }, source: "live", src: "UNI-PASS · KATI",
    srcDesc: "관세청 UNI-PASS 화물통관진행정보 API(실시간 진행단계) + aT KATI 농식품 통관문제 사례(검역 불합격 리스크 이력)" },
  { key: "release", name: "컨테이너 반출",  base: 4,  drivers: { cong: 0.5 },          source: "semi", src: "UNI-PASS 반출상태",
    srcDesc: "UNI-PASS 물품반출 상태값. 보세창고 시스템 연동 정도에 따라 지연 가능" },
  { key: "inland",  name: "냉장 내륙운송",  base: 6,  drivers: { wx: 0.7, cong: 0.2 }, source: "est",  src: "운송사 TMS(Phase2)",
    srcDesc: "운송사 GPS/TMS 연동 필요. 표준화 미비로 Phase 2 과제. MVP는 과거 평균+도로교통 추정" },
  { key: "fc_in",   name: "FC 입고 대기",   base: 5,  drivers: { dock: 1.0 },          source: "live", src: "자사 WMS Dock",
    srcDesc: "자사 FC의 WMS Dock 예약·입고 데이터. 자사 시스템이면 완전 실시간" },
];

// 데이터 소스 상태별 색상/라벨
const SOURCE_META = {
  live: { label: "실시간", dot: "#00B26C" },
  semi: { label: "준실시간", dot: "#FF9500" },
  est:  { label: "추정", dot: "#8B95A1" },
};

const RISKS = [
  { key: "cong", name: "항만 혼잡도" },
  { key: "cust", name: "통관·검역 리스크" },
  { key: "wx",   name: "기상 리스크" },
  { key: "dock", name: "FC Dock 혼잡" },
];

const FC_INIT = [
  { id: "FC001", name: "인천 FC", stock: 1400, demand: 1000, safety: 1.5, capacity: 3000 },
  { id: "FC002", name: "김포 FC", stock: 5200, demand: 1000, safety: 1.5, capacity: 6000 },
  { id: "FC003", name: "용인 FC", stock: 700,  demand: 1200, safety: 1.5, capacity: 2500 },
  { id: "FC004", name: "안성 FC", stock: 4800, demand: 800,  safety: 1.5, capacity: 5500 },
];

// ── 시연용 가상 BL ────────────────────────────────────────────
// 실제 운영 시 UNI-PASS 화물통관진행정보 API를 BL/화물관리번호로 조회해
// stage(현재 진행단계)·risk(구간별 리스크)를 받아온다. 여기선 데모용 상수.
// STAGE_ORDER = SEGMENTS의 진행 순서(어디까지 왔는지 스테퍼 표시용).
const STAGE_ORDER = ["port", "customs", "release", "inland", "fc_in"];
const MOCK_BLS = [
  { bl: "MAEU2406CL427", item: "칠레산 체리",  flag: "🇨🇱", origin: "발파라이소", pod: "인천항",
    vessel: "MAERSK SELETAR 2406W", vol: 4000, stage: "customs", perish: 2.0, price: 12000,
    risk: { cong: 0.7, cust: 0.6, wx: 0.4, dock: 0.5 }, note: "검역 집중관리 품목 · 태풍 영향권 (위기 시나리오)" },
  { bl: "ONEY2406NO113", item: "노르웨이 연어", flag: "🇳🇴", origin: "오슬로",     pod: "인천항",
    vessel: "ONE OLYMPUS 015E",     vol: 2000, stage: "inland", perish: 1.4, price: 9000,
    risk: { cong: 0.2, cust: 0.2, wx: 0.1, dock: 0.2 }, note: "통관 완료 · 정상 흐름 (평소 시나리오)" },
  { bl: "HLCU2406VN815", item: "베트남 생망고", flag: "🇻🇳", origin: "호치민",     pod: "인천항",
    vessel: "HMM ROTTERDAM 0617",   vol: 3000, stage: "port", perish: 1.6, price: 6000,
    risk: { cong: 0.6, cust: 0.4, wx: 0.3, dock: 0.3 }, note: "항만 혼잡 · 접안 대기 중" },
  { bl: "COSU2406US309", item: "미국산 오렌지", flag: "🇺🇸", origin: "롱비치",     pod: "인천항",
    vessel: "COSCO SHIPPING 088E",  vol: 1500, stage: "release", perish: 0.8, price: 4000,
    risk: { cong: 0.3, cust: 0.5, wx: 0.2, dock: 0.4 }, note: "검역 서류 보완 요청 이력" },
];
// BL/화물관리번호 조회 (대소문자·하이픈·공백 무시). 없으면 null.
function lookupBl(q) {
  const norm = (s) => s.trim().toUpperCase().replace(/[\s-]/g, "");
  const key = norm(q);
  if (!key) return null;
  return MOCK_BLS.find((b) => norm(b.bl) === key) || null;
}

// Toss 스타일 토큰 (대시보드 샘플) — 그레이 배경 + 화이트 카드 + 토스블루(#3182F6) 액센트.
const C = {
  bg: "#F2F4F6",      // 페이지 배경 (Toss 그레이)
  panel: "#FFFFFF",   // 카드 표면 (화이트)
  panel2: "#EAEDF1",  // 인셋 표면 / 슬라이더·바 트랙
  grid: "#E5E8EB",    // 보더 (grey200)
  text: "#191F28",    // 본문 (Toss 잉크 grey900)
  dim: "#6B7684",     // 보조 텍스트 (grey600)
  red: "#F04452", amber: "#FF9500", green: "#00B26C", blue: "#3182F6",
  accent: "#3182F6",  // 토스블루 — 주 액센트 (블루 forward)
  purple: "#7B61FF",
  shadow: "0 1px 3px rgba(0,27,55,0.04), 0 4px 14px rgba(0,27,55,0.05)", // Toss soft shadow
};
// Pretendard — Toss류 한국어 최적 폰트(한글 글리프 완비). 숫자는 IBM Plex Mono.
const FONT = "'Pretendard Variable', Pretendard, system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif";

// ── 엔진 함수 ─────────────────────────────────────────────────
function computeLeadtime(risk) {
  const seg = SEGMENTS.map((s) => {
    let m = 1;
    for (const [d, sn] of Object.entries(s.drivers)) m += (risk[d] || 0) * sn;
    return { name: s.name, hours: s.base * m, base: s.base, source: s.source, src: s.src, srcDesc: s.srcDesc };
  });
  const total = seg.reduce((a, b) => a + b.hours, 0);
  return { seg, total };
}

function assess(fcs, ltDays) {
  return fcs.map((f) => {
    const coverage = f.stock / f.demand;
    const gap = coverage - ltDays;
    return { ...f, coverage, gap, risk: gap < 0 ? "High" : gap < 1 ? "Medium" : "Low" };
  });
}

// 2단계 선제배치: (1) 신규 선적 부족분 비례배정 → (2) 과재고 FC 이관
function recommend(fcsInit, ltDays, vol) {
  const after = fcsInit.map((f) => ({ ...f }));
  const actions = [];
  let pool = vol;
  const needs = after.map((f) => ({ f, need: Math.max(0, Math.ceil((f.safety + ltDays) * f.demand - f.stock)) }));
  const tot = needs.reduce((a, b) => a + b.need, 0);
  if (tot > 0) {
    needs.forEach((n) => {
      if (pool <= 0 || n.need <= 0) return;
      const give = Math.min(n.need, Math.round(vol * n.need / tot), pool);
      n.f.stock += give; pool -= give;
      if (give > 0) actions.push(`신규 선적 → ${n.f.name}: ${give.toLocaleString()}개 우선배정`);
    });
  }
  if (pool > 0) {
    const worst = assess(after, ltDays).sort((a, b) => a.gap - b.gap)[0];
    const tf = after.find((f) => f.id === worst.id);
    tf.stock += pool; actions.push(`잔여 물량 → ${tf.name}: ${pool.toLocaleString()}개`);
  }
  const mid = assess(after, ltDays);
  for (const hf of mid.filter((f) => f.risk === "High")) {
    const tf = after.find((f) => f.id === hf.id);
    const target = Math.ceil((hf.safety + ltDays) * hf.demand);
    let need = target - tf.stock;
    const donors = assess(after, ltDays).filter((f) => f.id !== hf.id && f.gap > 1).sort((a, b) => b.gap - a.gap);
    for (const d of donors) {
      if (need <= 0) break;
      const df = after.find((f) => f.id === d.id);
      const spare = Math.floor((d.gap - 1) * d.demand);
      if (spare <= 0) continue;
      const mv = Math.min(need, spare);
      df.stock -= mv; tf.stock += mv; need -= mv;
      actions.push(`재고 이관: ${d.name} → ${hf.name} ${mv.toLocaleString()}개`);
    }
  }
  return { after, actions };
}

// ── Phase 2-A: 이상 신호 조기경보 ────────────────────────────
// baseline(평소 리드타임 평균·표준편차) 대비 z-score 이탈 + 추세 외삽으로
// 결품 도달 "전에" 경보. 검증: 평균 선행 7.4h, 오경보율 1.5%.
function detectEarlyWarning(history, highThresholdHrs) {
  // history: 최근 리드타임(hr) 관측 배열 (최신이 마지막)
  if (history.length < 6) return { warn: false };
  const win = history.slice(-12);
  const m = win.reduce((a, b) => a + b, 0) / win.length;
  const sd = Math.sqrt(win.reduce((a, b) => a + (b - m) ** 2, 0) / win.length) || 1;
  const cur = history[history.length - 1];
  const z = (cur - m) / sd;
  const slope = history.length >= 4
    ? (history[history.length - 1] - history[history.length - 4]) / 3 : 0;
  const projected = cur + slope * 5; // 5틱 뒤 예측
  const warn = z > 1.8 && slope > 0 && projected > highThresholdHrs * 0.9;
  return { warn, z, slope, projected, cur };
}

// ── 주문 시점 제안 (Two-way) ─────────────────────────────────
// Way1: Risk 시 "언제 주문했어야 / 지금 가능한가"
// Way2: DOC + 창고 가동률 기반 최적 발주 시점·발주량·공간 제약
// nowHr=기준시각(시), ltDays=예측 리드타임(일), safetyBufHr=안전버퍼
function suggestOrder(fc, ltDays, nowHr = 9, safetyBufHr = 6) {
  const docDays = fc.stock / fc.demand;
  const stockoutHr = nowHr + docDays * 24;                 // 결품 예상 시각
  const orderByHr = stockoutHr - ltDays * 24 - safetyBufHr; // 발주 마감(역산)
  const feasible = orderByHr >= nowHr;                      // 지금 주문해 맞출 수 있나
  const slackHr = orderByHr - nowHr;                        // +여유 / −지각

  // 가동률·공간
  const utilization = fc.capacity ? fc.stock / fc.capacity : 0;
  const targetStock = (fc.safety + ltDays) * fc.demand;
  const orderQty = Math.max(0, Math.ceil(targetStock - fc.stock));
  const freeSpace = fc.capacity ? Math.floor(fc.capacity * (1 - utilization)) : Infinity;
  const spaceDeficit = Math.max(0, orderQty - freeSpace);
  const spaceWaitHr = spaceDeficit / fc.demand * 24;
  const spaceTight = spaceDeficit > 0;

  return { docDays, stockoutHr, orderByHr, feasible, slackHr,
           utilization, orderQty, freeSpace, spaceDeficit, spaceWaitHr, spaceTight };
}

// 시각 포맷 (Day offset 포함, 음수/24h+ 허용)
function fmtHr(hr) {
  const dayOff = Math.floor(hr / 24);
  const h = ((Math.floor(hr) % 24) + 24) % 24;
  const m = Math.round((hr - Math.floor(hr)) * 60);
  const tag = dayOff === 0 ? "" : dayOff === 1 ? "(익일)" : dayOff < 0 ? `(D${dayOff})` : `(D+${dayOff})`;
  return `${String(h).padStart(2, "0")}:${String((m + 60) % 60).padStart(2, "0")}${tag}`;
}

const riskColor = (r) => (r === "High" ? C.red : r === "Medium" ? C.amber : C.green);

// 신선도(상품가치 손실) 위험 — 콜드체인 정상 허용일(hold) 초과분에 대해 품목 perishability와
// 온도/폭염 리스크(wx)로 가속되는 일일 가치손실률을 누적. 명백한 휴리스틱(시나리오 기반). test_freshness.mjs 검증.
const FRESH = { hold: 2.0, baseLoss: 0.06, heatK: 1.5, cap: 0.45 };
function computeFreshnessRisk(ltDays, wx, perish = 1.0) {
  const effRate = FRESH.baseLoss * (1 + wx * FRESH.heatK);
  const lossPct = Math.min(FRESH.cap, Math.max(0, perish * effRate * (ltDays - FRESH.hold)));
  const level = lossPct < 0.03 ? "Low" : lossPct < 0.10 ? "Medium" : "High";
  return { lossPct, level };
}

// 비용 임팩트 — 선제조치 유무에 따른 결품·폐기·운송 비용 비교. test_costimpact.mjs 검증.
//  적용 전(선제조치 X): 현재 재고 그대로 → 결품(부족분) + 재고폐기(목표 초과 잉여) 손실 발생, 운송비 0.
//  적용 후(FreshFlow): 신규선적 배치 + 과재고를 결품 FC로 이관 → 결품·폐기 감소, 대신 이관·배치 운송비 투입.
const COST = { lostMargin: 0.30, spoilRate: 0.50, defaultPrice: 7000, inbound: 250, transfer: 700 };
function computeCostImpact(beforeFcs, afterFcs, ltDays, vol, price) {
  const target = (f) => (f.safety + ltDays) * f.demand;          // 안전재고+리드타임 목표 재고
  const stockoutU = (f) => Math.max(0, Math.round(ltDays * f.demand - f.stock)); // 리드타임 중 결품 수량
  const overU = (f) => Math.max(0, Math.round(f.stock - target(f)));             // 목표 초과 잉여(폐기 위험)
  const roomU = (f) => Math.max(0, Math.round(target(f) - f.stock));             // 목표까지 남은 공간

  let soB = 0, exB = 0;
  for (const f of beforeFcs) { soB += stockoutU(f); exB += overU(f); }
  const before = {
    stockoutUnits: soB, overUnits: exB,
    stockoutCost: soB * price * COST.lostMargin, spoilCost: exB * price * COST.spoilRate, transportCost: 0,
  };
  before.total = before.stockoutCost + before.spoilCost;

  let soA = 0, totalOver = 0, totalRoom = 0;
  for (const f of afterFcs) { soA += stockoutU(f); totalOver += overU(f); totalRoom += roomU(f); }
  const movedUnits = Math.min(totalOver, totalRoom);             // 과재고 → 미달 FC 이관량
  const overAfter = totalOver - movedUnits;
  const placedUnits = Math.min(vol, beforeFcs.reduce((a, f) => a + roomU(f), 0)); // 신규선적 배치량
  const after = {
    stockoutUnits: soA, overUnits: overAfter, movedUnits, placedUnits,
    stockoutCost: soA * price * COST.lostMargin, spoilCost: overAfter * price * COST.spoilRate,
    transportCost: placedUnits * COST.inbound + movedUnits * COST.transfer,
  };
  after.total = after.stockoutCost + after.spoilCost + after.transportCost;
  return { before, after, saved: before.total - after.total };
}
const fmtWon = (w) => "₩" + Math.round(w).toLocaleString();
const fmtMan = (w) => Math.round(w / 10000).toLocaleString() + "만원";

// AI 진단 텍스트를 라벨 섹션(진단|조치|실행)으로 파싱. 형식 미준수 시 null 반환 → 호출부에서 문장 폴백.
const AI_SECTIONS = [
  { marker: "진단", title: "핵심 진단", color: C.red },
  { marker: "조치", title: "권장 조치", color: C.blue },
  { marker: "실행", title: "지금 할 일", color: C.green },
];
function parseAiSections(text) {
  const out = [];
  for (const raw of text.split("\n")) {
    const t = raw.trim();
    if (!t) continue;
    const m = AI_SECTIONS.find((x) => new RegExp(`^${x.marker}\\s*[|：:]`).test(t));
    if (!m) continue;
    const body = t.replace(new RegExp(`^${m.marker}\\s*[|：:]\\s*`), "").trim();
    if (body) out.push({ title: m.title, color: m.color, body });
  }
  return out.length ? out : null;
}

export default function FreshFlowAI() {
  const [risk, setRisk] = useState({ cong: 0.2, cust: 0.2, wx: 0.1, dock: 0.2 });
  const [vol, setVol] = useState(4000);
  const [mode, setMode] = useState("before");

  // BL 화물 조회 상태 — 선택 시 해당 화물의 risk·vol을 엔진에 주입
  const [blInput, setBlInput] = useState("");
  const [selectedBl, setSelectedBl] = useState(null);
  const [blError, setBlError] = useState("");

  // Phase 2-E: 선제 조치(Prescriptive) — 실행한 액션 로그 [{id,icon,title}]
  const [actionLog, setActionLog] = useState([]);

  // AI 상세 진단(Claude API) 상태 — 규칙 기반은 항상 살아있고, 이건 부가 기능
  const [aiText, setAiText] = useState("");      // LLM 생성 진단
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const aiSections = useMemo(() => (aiText ? parseAiSections(aiText) : null), [aiText]); // 라벨 섹션 파싱(폴백 null)

  // Phase 2-A: 조기경보 모니터링 상태
  const [monitoring, setMonitoring] = useState(false);
  const [monTick, setMonTick] = useState(0);          // 경과 틱 (1틱=30분)
  const [ltHistory, setLtHistory] = useState([]);     // 리드타임 관측 시계열
  const [warning, setWarning] = useState(null);       // {warnTick, leadHrs} 경보 발생
  const monRef = useRef({ tick: 0, history: [], warned: false });

  const lt = useMemo(() => computeLeadtime(risk), [risk]);
  const ltDays = lt.total / 24;
  const before = useMemo(() => assess(FC_INIT, ltDays), [ltDays]);
  const rec = useMemo(() => recommend(FC_INIT, ltDays, vol), [ltDays, vol]);
  const afterAssessed = useMemo(() => assess(rec.after, ltDays), [rec, ltDays]);
  const shown = mode === "before" ? before : afterAssessed;

  const leaks = lt.seg.map((s) => ({ name: s.name, leak: s.hours - s.base })).sort((a, b) => b.leak - a.leak);
  const topLeaks = leaks.filter((l) => l.leak > 0.3).slice(0, 2);
  const maxH = Math.max(...lt.seg.map((s) => s.hours));

  const bHigh = before.filter((f) => f.risk === "High");
  const aHigh = afterAssessed.filter((f) => f.risk === "High");

  // 신선도(상품가치 손실) 위험 — 현재 리드타임·기상리스크·선택 화물 perishability 기반
  const fresh = useMemo(
    () => computeFreshnessRisk(ltDays, risk.wx, selectedBl?.perish ?? 1.0),
    [ltDays, risk.wx, selectedBl]
  );

  // Phase 2-E: 현재 엔진 상태에서 선제 조치(Action Item) 생성 — 경보를 '실행 가능한 버튼'으로
  const actionItems = useMemo(() => {
    const items = [];
    if (bHigh.length && rec.actions.length) {
      items.push({
        id: "preposition", icon: "📦", urgency: "high",
        title: `선제배치 실행 — 신규 선적 ${vol.toLocaleString()}개 배분`,
        basis: `결품 위험 ${bHigh.length}개 FC (${bHigh.map((f) => f.name).join("·")})`,
        lines: rec.actions,
        effect: `결품 High ${bHigh.length}개 → ${aHigh.length}개${aHigh.length === 0 ? " 전량 해소" : ""}`,
        cta: "배치 실행", apply: "after",
      });
    }
    if (risk.dock >= 0.4) {
      items.push({
        id: "dockslot", icon: "🚪", urgency: risk.dock >= 0.5 ? "high" : "med",
        title: "FC 입고 슬롯 조정",
        basis: `FC Dock 혼잡 ${Math.round(risk.dock * 100)}% — 야드 대기 증가 예상`,
        effect: "피크 시간 회피로 입고 대기 단축",
        cta: "슬롯 16시→18시 변경",
      });
    }
    if (aHigh.length) {
      const short = aHigh.reduce((a, f) => a + Math.max(0, Math.ceil((f.safety + ltDays) * f.demand - f.stock)), 0);
      const units = Math.max(100, Math.round(short / 50) * 50);
      items.push({
        id: "milkrun", icon: "🚚", urgency: "high",
        title: "대체 공급처 긴급 수급 (밀크런)",
        basis: `선제배치 후에도 결품 위험 ${aHigh.length}개 — ${aHigh.map((f) => f.name).join("·")}`,
        effect: `국내 도매·타 항만 재고에서 약 ${units.toLocaleString()}개 긴급 수급`,
        cta: `밀크런 ${units.toLocaleString()}개 요청`,
      });
    }
    return items;
  }, [bHigh, aHigh, rec, risk.dock, ltDays, vol]);

  // 비용 임팩트 — 선제조치 전(현재재고) vs 후(신규배치+이관)의 결품·폐기·운송 비용
  const price = selectedBl?.price ?? COST.defaultPrice;
  const cost = useMemo(() => computeCostImpact(before, rec.after, ltDays, vol, price), [before, rec.after, ltDays, vol, price]);
  const costBefore = cost.before, costAfter = cost.after, costSaved = cost.saved;
  const savedPct = costBefore.total > 0 ? Math.round((costSaved / costBefore.total) * 100) : 0;

  // 액션 실행(데모): 로그에 기록하고, 선제배치는 ③ 뷰를 AFTER로 전환해 효과를 즉시 시각화
  const runAction = (item) => {
    if (actionLog.some((l) => l.id === item.id)) return;
    setActionLog((log) => [...log, { id: item.id, icon: item.icon, title: item.title }]);
    if (item.apply === "after") setMode("after");
  };

  // 조기경보 임계: 관찰 FC(여유 있는 김포 FC, 커버 5.2일이 아닌 중간값) 기준
  // 가장 먼저 위험해질 FC = 커버리지 최소(여기선 데모용으로 2.5일 커버 가상 FC 관찰)
  const watchCoverageDays = 2.5;
  const highThresholdHrs = watchCoverageDays * 24;

  // 모니터링 시계열 재생: 1틱=30분, 리스크가 점진 악화되는 6시간 시나리오
  useEffect(() => {
    if (!monitoring) return;
    const TOTAL = 40;
    const id = setInterval(() => {
      const st = monRef.current;
      st.tick += 1;
      // 0~12틱 평소, 이후 점진 악화 (통관·항만 리스크 상승)
      const p = Math.max(0, (st.tick - 12) / (TOTAL - 12));
      const r = { cong: 0.2 + 0.6 * p, cust: 0.2 + 0.6 * p, wx: 0.1 + 0.2 * p, dock: 0.2 + 0.2 * p };
      const ltNow = computeLeadtime(r).total * (1 + (Math.random() * 2 - 1) * 0.05);
      st.history.push(ltNow);

      const ew = detectEarlyWarning(st.history, highThresholdHrs);
      const isHigh = ltNow >= highThresholdHrs;

      if (!st.warned && ew.warn && !isHigh) {
        st.warned = true;
        // 결품까지 남은 예상 시간 = (임계-현재)/상승률
        const slope = ew.slope > 0 ? ew.slope : 1;
        const ticksToHigh = Math.max(1, (highThresholdHrs - ltNow) / slope);
        setWarning({ warnTick: st.tick, leadHrs: (ticksToHigh * 0.5).toFixed(1) });
      }

      setMonTick(st.tick);
      setLtHistory([...st.history]);

      if (st.tick >= TOTAL) { setMonitoring(false); clearInterval(id); }
    }, 250);
    return () => clearInterval(id);
  }, [monitoring]);

  const startMonitoring = () => {
    monRef.current = { tick: 0, history: [], warned: false };
    setMonTick(0); setLtHistory([]); setWarning(null);
    setMonitoring(true);
  };

  const setScenario = (s) => {
    setRisk(s === "normal"
      ? { cong: 0.2, cust: 0.2, wx: 0.1, dock: 0.2 }
      : { cong: 0.7, cust: 0.6, wx: 0.4, dock: 0.5 });
    setAiText(""); setAiError(""); // 시나리오 바뀌면 이전 AI 진단 초기화
    setActionLog([]); setMode("before");
  };

  // BL 화물을 엔진에 적용: 해당 화물의 리스크·물량을 주입하고 이전 분석 초기화
  const applyBl = (b) => {
    setSelectedBl(b);
    setBlInput(b.bl);
    setBlError("");
    setRisk(b.risk);
    setVol(b.vol);
    setAiText(""); setAiError("");
    setActionLog([]); setMode("before");
  };
  const onBlSearch = () => {
    const b = lookupBl(blInput);
    if (b) applyBl(b);
    else { setSelectedBl(null); setBlError("해당 BL을 찾을 수 없습니다. 아래 예시 화물을 눌러보세요."); }
  };

  // ── Claude API로 요나 상세 진단 생성 ──────────────────────
  // 엔진이 이미 계산한 수치를 프롬프트로 묶어 호출. 실패해도 규칙기반 진단은 유지.
  async function runAiDiagnosis() {
    setAiLoading(true); setAiError(""); setAiText("");
    const segLines = lt.seg.map((s) => `- ${s.name}: ${s.hours.toFixed(1)}시간(정상 ${s.base}시간)`).join("\n");
    const fcLines = before.map((f) => `- ${f.name}: 재고 ${Math.round(f.stock)}, 일수요 ${f.demand}, 커버리지 ${f.coverage.toFixed(1)}일, 결품위험 ${f.risk}`).join("\n");
    const actLines = rec.actions.length ? rec.actions.map((a) => `- ${a}`).join("\n") : "- (해당 없음)";
    const leakLine = topLeaks.length ? topLeaks.map((t) => `${t.name}(+${t.leak.toFixed(1)}h)`).join(", ") : "없음";

    const prompt = `당신은 수입 신선식품 콜드체인 공급망의 운영 관제 AI '요나'입니다. 아래 실시간 분석 데이터를 바탕으로, 현장 운영 관리자에게 브리핑하듯 한국어로 진단하세요.

[Port-to-FC 리드타임 분석] 총 ${lt.total.toFixed(1)}시간 (${ltDays.toFixed(2)}일)
${segLines}
가장 지연이 큰 구간: ${leakLine}

[FC별 결품 위험]
${fcLines}

[신선도(상품가치 손실) 위험] 예상 손실률 ${(fresh.lossPct * 100).toFixed(0)}% (${fresh.level}) — 리드타임 ${ltDays.toFixed(2)}일·기상리스크 ${Math.round(risk.wx * 100)}% 기준

[권장 선제배치 (신규 선적 ${vol.toLocaleString()}개 활용)]
${actLines}
조치 후 결품위험 High: ${bHigh.length}개 → ${aHigh.length}개

[비용 임팩트] FreshFlow 적용 전 손실 ${fmtWon(costBefore.total)} → 적용 후 ${fmtWon(costAfter.total)} (절감 ${fmtWon(costSaved)}, ${savedPct}%)

위 데이터로 아래 세 항목을 작성하세요. 반드시 각 항목을 지정된 머리말과 세로줄(|)로 시작하고, 한 항목은 한 줄(줄바꿈 없이)로 쓰세요:
진단| 가장 위급한 상황과 그 원인이 어느 리드타임 구간에서 비롯됐는지 1~2문장.
조치| 권장 선제배치의 핵심과 기대효과 1~2문장.
실행| 운영 관리자가 지금 당장 챙겨야 할 실무 액션 한 가지를 1문장.
표·불릿·별표·마크다운 기호 없이 자연스러운 문장으로. 과장 없이 데이터에 근거해서.`;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).filter(Boolean).join("\n").trim();
      if (!text) throw new Error("빈 응답");
      setAiText(text);
    } catch (e) {
      setAiError("AI 상세 진단을 불러오지 못했습니다. 아래 기본 진단을 참고하세요.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100%", padding: "28px 34px",
      fontFamily: FONT }}>
      <style>{`
        * { box-sizing: border-box; }
        input[type=range]{ -webkit-appearance:none; height:5px; border-radius:3px; background:${C.grid}; outline:none; }
        input[type=range]::-webkit-slider-thumb{ -webkit-appearance:none; width:15px; height:15px; border-radius:50%; background:${C.accent}; cursor:pointer; box-shadow:0 1px 3px rgba(20,20,19,.18); }`}</style>

      <p style={{ fontSize: 16, color: C.dim, margin: "0 0 24px", maxWidth: 760,
        lineHeight: 1.5, letterSpacing: -0.2 }}>
        "선박이 언제 도착하는가"가 아니라 — <span style={{ color: C.text, fontWeight: 600 }}>"언제 FC에 입고되어 판매가능 재고가 되는가"</span>
      </p>

      {/* ⓪ BL 화물 조회 */}
      <Section>
        <Header label="⓪ 화물 조회 · BL / 화물관리번호로 통관 진행 추적 (UNI-PASS)" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={blInput}
            onChange={(e) => setBlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onBlSearch(); }}
            placeholder="BL 번호 입력 후 조회 (예: MAEU2406CL427)"
            style={{ flex: "1 1 240px", minWidth: 200, background: C.panel2, border: `0.5px solid ${C.grid}`,
              borderRadius: 6, color: C.text, fontSize: 13, padding: "8px 11px", fontFamily: "'IBM Plex Mono', monospace" }}
          />
          <button onClick={onBlSearch} style={{ border: `1px solid ${C.accent}`, background: C.accent, color: "#fff",
            borderRadius: 8, padding: "8px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>조회</button>
        </div>
        {blError && <div style={{ marginTop: 8, fontSize: 12, color: C.amber }}>{blError}</div>}

        {/* 예시 화물 칩 */}
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.dim }}>예시 화물:</span>
          {MOCK_BLS.map((b) => {
            const on = selectedBl?.bl === b.bl;
            return (
              <button key={b.bl} onClick={() => applyBl(b)} style={{
                border: `0.5px solid ${on ? C.blue : C.grid}`, background: on ? `${C.blue}22` : "transparent",
                color: on ? C.blue : C.dim, borderRadius: 20, padding: "4px 11px", fontSize: 11, cursor: "pointer",
              }}>{b.flag} {b.item}</button>
            );
          })}
        </div>

        {/* 선택된 BL 상세 + 통관 진행 스테퍼 */}
        {selectedBl && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${C.grid}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "baseline" }}>
              <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{selectedBl.flag} {selectedBl.item}</span>
                <span style={{ fontSize: 11, color: C.dim, fontFamily: "'IBM Plex Mono', monospace" }}>{selectedBl.bl}</span>
              </span>
              <span style={{ fontSize: 12, color: C.dim }}>{selectedBl.origin} → {selectedBl.pod} · {selectedBl.vessel}</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: C.dim }}>
              물량 <b style={{ color: C.text }}>{selectedBl.vol.toLocaleString()}개</b> · {selectedBl.note}
            </div>

            {/* 통관 진행 스테퍼 */}
            <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start" }}>
              {STAGE_ORDER.map((sk, i) => {
                const seg = SEGMENTS.find((s) => s.key === sk);
                const cur = STAGE_ORDER.indexOf(selectedBl.stage);
                const state = i < cur ? "done" : i === cur ? "current" : "todo";
                const col = state === "done" ? C.green : state === "current" ? C.blue : C.grid;
                return (
                  <React.Fragment key={sk}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: 64 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", border: `1.5px solid ${col}`,
                        background: state === "current" ? col : state === "done" ? `${C.green}33` : "transparent",
                        color: state === "current" ? "#fff" : col, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
                        ...(state === "current" ? { boxShadow: `0 0 8px ${C.blue}` } : {}) }}>
                        {state === "done" ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: 9.5, textAlign: "center", lineHeight: 1.25,
                        color: state === "current" ? C.blue : C.dim }}>{seg.name}</span>
                    </div>
                    {i < STAGE_ORDER.length - 1 && (
                      <div style={{ flex: 1, height: 1.5, marginTop: 11,
                        background: i < cur ? C.green : C.grid }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.dim }}>
              현재 위치: <b style={{ color: C.blue }}>{SEGMENTS.find((s) => s.key === selectedBl.stage)?.name}</b> 진행 중
              — 이 화물의 구간별 리스크가 아래 리드타임·결품 분석에 반영됩니다.
            </div>
          </div>
        )}
      </Section>

      {/* ① 리스크 입력 */}
      <Section>
        <Header label={selectedBl ? `① 선적 리스크 · ${selectedBl.item} (BL 반영, 슬라이더로 what-if 조정 가능)` : "① 선적 리스크 입력 · 인천항 → 수도권 FC"}>
          <Toggle options={[["normal", "평소", C.green], ["crisis", "위기", C.red]]}
            value={risk.cong > 0.5 ? "crisis" : "normal"} onChange={setScenario} />
        </Header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 16, marginTop: 4 }}>
          {RISKS.map((r) => (
            <div key={r.key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.dim, marginBottom: 5 }}>
                <span>{r.name}</span>
                <span style={{ fontWeight: 600, color: C.text }}>{Math.round(risk[r.key] * 100)}%</span>
              </div>
              <input type="range" min="0" max="100" value={risk[r.key] * 100} style={{ width: "100%" }}
                onChange={(e) => setRisk({ ...risk, [r.key]: e.target.value / 100 })} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: C.dim }}>신규 선적 물량</span>
          <input type="range" min="0" max="8000" step="500" value={vol} style={{ flex: 1 }}
            onChange={(e) => setVol(+e.target.value)} />
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 64, textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>
            {vol.toLocaleString()}
          </span>
        </div>
      </Section>

      {/* ② 리드타임 워터폴 — 하이라이트 */}
      <Section>
        <Header label="② Port-to-FC 리드타임 · 어디서 새는가">
          <span style={{ fontSize: 13, fontWeight: 600 }}>총 {lt.total.toFixed(1)}h ({ltDays.toFixed(2)}일)</span>
        </Header>
        <div style={{ marginTop: 14 }}>
          {lt.seg.map((s, i) => {
            const leak = s.hours - s.base;
            const leakPct = leak / s.base;
            const ratio = s.hours / s.base; // 평소(정상) 대비 배수 — 이상치 하이라이트용
            const col = leakPct > 0.5 ? C.red : leakPct > 0.25 ? C.amber : C.green;
            const w = (s.hours / maxH) * 100;
            const baseW = (s.base / maxH) * 100;
            const sm = SOURCE_META[s.source];
            return (
              <div key={i} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3, alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <span>{s.name}</span>
                    {ratio >= 1.5 && (
                      <span title={`평소(정상 ${s.base}h) 대비 ${ratio.toFixed(1)}배 소요 중`} style={{
                        fontSize: 9, fontWeight: 700, color: C.red, background: `${C.red}14`,
                        border: `1px solid ${C.red}44`, borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap",
                      }}>⚠ 평소 ×{ratio.toFixed(1)}</span>
                    )}
                    <span title={s.srcDesc || `데이터 출처: ${s.src}`} style={{
                      display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9,
                      color: C.dim, border: `0.5px solid ${C.grid}`, borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.dot, display: "inline-block",
                        ...(s.source === "live" ? { boxShadow: `0 0 4px ${sm.dot}` } : {}) }} />
                      {sm.label} · {s.src}
                    </span>
                  </span>
                  <span style={{ color: col, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {s.hours.toFixed(1)}h {leak > 0.3 && <span style={{ fontSize: 10 }}>(+{leak.toFixed(1)})</span>}
                  </span>
                </div>
                <div style={{ height: 18, background: C.panel2, borderRadius: 4, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${baseW}%`, background: C.green, opacity: 0.85 }} />
                  <div style={{ position: "absolute", left: `${baseW}%`, top: 0, bottom: 0, width: `${w - baseW}%`, background: col }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: C.dim }}>
          {topLeaks.length
            ? <>⚠ 가장 많이 새는 구간: <b style={{ color: C.red }}>{topLeaks.map((t) => `${t.name} +${t.leak.toFixed(1)}h`).join(", ")}</b> <span style={{ color: C.dim }}>(초록=정상, 빨강=지연)</span></>
            : <span style={{ color: C.green }}>✓ 전 구간 정상 범위 — 리스크를 올려 보세요</span>}
        </div>

        {/* 신선도(상품가치 손실) 위험 — 콜드체인은 '시간'뿐 아니라 '온도'. 리드타임↑·폭염↑ → 가치 손실 */}
        {(() => {
          const fc = riskColor(fresh.level);
          const danger = fresh.lossPct >= 0.03;
          return (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10,
              background: danger ? `${fc}12` : `${C.green}10`, border: `1px solid ${danger ? `${fc}55` : `${C.green}44`}`,
              borderRadius: 8, padding: "9px 13px" }}>
              <span style={{ fontSize: 18 }}>🌡️</span>
              <div style={{ fontSize: 12, color: C.text }}>
                {danger ? (
                  <>예상 상품가치 손실 위험 <b style={{ color: fc, fontSize: 16 }}>{(fresh.lossPct * 100).toFixed(0)}%</b>
                    <span style={{ color: fc, fontWeight: 700 }}> · {fresh.level}</span>
                    <span style={{ color: C.dim }}> — 리드타임 {ltDays.toFixed(2)}일 · 기상리스크 {Math.round(risk.wx * 100)}%
                      {selectedBl ? ` · ${selectedBl.item}(신선도 민감 ${selectedBl.perish.toFixed(1)})` : ""} 누적 신선도 저하</span>
                  </>
                ) : (
                  <span style={{ color: C.green }}>✓ 신선도 정상 — 현재 리드타임은 콜드체인 유지 범위(상품가치 손실 미미)</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* 데이터 소스 범례 */}
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `0.5px solid ${C.grid}`, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 10, color: C.dim }}>
          <span style={{ fontWeight: 600 }}>데이터 연동:</span>
          <Legend dot={SOURCE_META.live.dot} text="실시간 (공공 API 연동 가능)" />
          <Legend dot={SOURCE_META.semi.dot} text="준실시간" />
          <Legend dot={SOURCE_META.est.dot} text="추정 (Phase 2 연동 예정)" />
        </div>
      </Section>

      {/* ②-B 이상 신호 조기경보 (Phase 2-A) */}
      <Section>
        <Header label="②-B 이상 신호 조기경보 · 평소와 다른 신호를 먼저 감지">
          <button onClick={monitoring ? () => setMonitoring(false) : startMonitoring} style={{
            border: `0.5px solid ${monitoring ? C.amber : C.blue}`, background: "transparent",
            color: monitoring ? C.amber : C.blue, borderRadius: 6, padding: "4px 12px",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}>
            {monitoring ? "■ 모니터링 중…" : "▶ 실시간 모니터링 시작"}
          </button>
        </Header>

        {/* 경보 배너 */}
        {warning && (
          <div style={{
            background: `${C.red}22`, border: `1px solid ${C.red}`, borderRadius: 8,
            padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>🚨</span>
            <div style={{ fontSize: 13 }}>
              <b style={{ color: C.red }}>조기경보 발령</b> — 리드타임이 평소 패턴을 이탈해 악화 중입니다.
              결품 위험 도달까지 약 <b style={{ color: C.red }}>{warning.leadHrs}시간</b> 전에 감지했습니다.
              <span style={{ color: C.dim }}> → 지금 선제배치하면 결품을 막을 수 있습니다.</span>
            </div>
          </div>
        )}

        {/* 리드타임 추이 미니 차트 */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70, marginTop: 4 }}>
          {ltHistory.length === 0 ? (
            <div style={{ color: C.dim, fontSize: 12, alignSelf: "center" }}>
              모니터링을 시작하면 리드타임 추이를 실시간 추적하고, 평소와 다른 신호를 결품 전에 경보합니다.
            </div>
          ) : ltHistory.map((v, i) => {
            const h = Math.min(100, (v / (highThresholdHrs * 1.1)) * 100);
            const over = v >= highThresholdHrs;
            const atWarn = warning && i === warning.warnTick - 1;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", position: "relative" }}>
                {atWarn && <span style={{ position: "absolute", top: -2, left: "50%", transform: "translateX(-50%)", fontSize: 11 }}>🚨</span>}
                <div style={{
                  width: "100%", height: `${h}%`,
                  background: over ? C.red : atWarn ? C.amber : C.blue,
                  opacity: over ? 0.9 : 0.6, borderRadius: "2px 2px 0 0",
                }} />
              </div>
            );
          })}
        </div>
        {ltHistory.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.dim, marginTop: 4 }}>
            <span>경과 {(monTick * 0.5).toFixed(1)}h</span>
            <span style={{ color: C.red }}>― 결품 임계선 {(highThresholdHrs / 24).toFixed(1)}일({highThresholdHrs}h)</span>
            <span>현재 {ltHistory[ltHistory.length - 1].toFixed(1)}h</span>
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 11, color: C.dim }}>
          baseline(평소 평균±표준편차) 대비 z-score 이탈 + 추세 외삽으로 결품 <b>전에</b> 경보 · 검증: 평균 7.4시간 선행, 오경보율 1.5%
        </div>

        {/* 주문 시점 제안 (Two-way) */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${C.grid}` }}>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 4 }}>
            주문 시점 제안 · {warning
              ? <span style={{ color: C.red }}>Risk 기반 (현재 리드타임 {ltDays.toFixed(2)}일 적용)</span>
              : <span>정상 계획 (평소 리드타임 {ltDays.toFixed(2)}일 적용)</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FC_INIT.map((fc) => {
              const o = suggestOrder(fc, ltDays);
              const util = Math.round(o.utilization * 100);
              if (!o.feasible) {
                // Way1: 신규주문 불가
                const reason = o.docDays < ltDays
                  ? `재고 ${o.docDays.toFixed(1)}일 < 리드타임 ${ltDays.toFixed(1)}일`
                  : `발주 적기 ${(-o.slackHr).toFixed(0)}h 경과`;
                return (
                  <div key={fc.id} style={{ fontSize: 12, borderLeft: `3px solid ${C.red}`, paddingLeft: 8 }}>
                    <b>{fc.name}</b> <span style={{ color: C.red }}>✗ 신규주문 불가</span>
                    <span style={{ color: C.dim }}> ({reason}) → 즉시 FC간 이관 필요. 결품 막으려면 {fmtHr(o.orderByHr)}까지 주문했어야 함</span>
                  </div>
                );
              }
              // Way2: 발주 가능
              return (
                <div key={fc.id} style={{ fontSize: 12, borderLeft: `3px solid ${o.spaceTight ? C.amber : C.green}`, paddingLeft: 8 }}>
                  <b>{fc.name}</b> <span style={{ color: o.spaceTight ? C.amber : C.green }}>
                    {o.orderQty > 0 ? `발주 권장 ${o.orderQty.toLocaleString()}개` : "재고 충분"}</span>
                  <span style={{ color: C.dim }}>
                    {" "}· DOC {o.docDays.toFixed(1)}일 · 가동률 {util}% · 발주마감 {fmtHr(o.orderByHr)}
                    {o.spaceTight && <span style={{ color: C.amber }}> · ⚠ 공간부족 {o.spaceDeficit}개({o.spaceWaitHr.toFixed(0)}h 소진 후 입고) → 분할발주 권장</span>}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: C.dim }}>
            발주마감 = 결품시점 − 리드타임 − 안전버퍼(6h) 역산 · 가동률 높은 FC는 입고 공간 확보 위해 분할발주 제안
          </div>
        </div>
      </Section>

      {/* ③④ FC 리스크 + Copilot */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Section noMargin>
          <Header label="③ FC 결품 위험">
            <Toggle options={[["before", "BEFORE", C.red], ["after", "AFTER", C.green]]} value={mode} onChange={setMode} />
          </Header>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            {shown.map((f) => {
              const col = riskColor(f.risk);
              const covPct = Math.min(100, f.coverage / 4 * 100);
              return (
                <div key={f.id} style={{ border: `0.5px solid ${C.grid}`, borderLeft: `3px solid ${col}`, borderRadius: 6, padding: "8px 11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: col, padding: "1px 8px", borderRadius: 10 }}>{f.risk}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.dim, marginTop: 3 }}>
                    <span>재고 {Math.round(f.stock).toLocaleString()} · 커버 {f.coverage.toFixed(1)}일</span>
                    <span>gap {f.gap.toFixed(2)}일</span>
                  </div>
                  <div style={{ height: 5, background: C.panel2, borderRadius: 3, marginTop: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${covPct}%`, background: col, opacity: 0.9 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <div style={{ background: C.panel, border: `0.5px solid ${bHigh.length ? C.red : C.grid}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, color: "#fff", background: bHigh.length ? C.red : C.green }}>요</div>
            <span style={{ fontSize: 12, color: C.dim }}>④ AI Copilot 추천</span>
            <button onClick={runAiDiagnosis} disabled={aiLoading} style={{
              marginLeft: "auto", border: `0.5px solid ${C.blue}`, background: aiLoading ? C.grid : "transparent",
              color: aiLoading ? C.dim : C.blue, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600,
              cursor: aiLoading ? "default" : "pointer",
            }}>
              {aiLoading ? "분석 중…" : "✦ AI 상세 진단"}
            </button>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            {bHigh.length ? (
              <>
                <p style={{ margin: "0 0 8px" }}>
                  예측 리드타임 <b>{ltDays.toFixed(2)}일</b> 기준, <b style={{ color: C.red }}>{bHigh.map((f) => f.name).join("·")}</b>가 결품 위험입니다. 재고 커버리지가 리드타임보다 짧습니다.
                </p>
                <div style={{ fontSize: 12, color: C.dim, marginBottom: 5 }}>권장 조치</div>
                {rec.actions.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                    <span style={{ color: C.blue }}>›</span><span style={{ fontSize: 12 }}>{a}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${C.grid}`, fontSize: 12 }}>
                  조치 후 결품 위험 FC <b style={{ color: C.red }}>{bHigh.length}개</b> → <b style={{ color: C.green }}>{aHigh.length}개</b>
                  {aHigh.length === 0 && <span style={{ color: C.green }}> 전량 해소</span>}
                </div>
                {topLeaks.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 11, color: C.dim }}>
                    + {topLeaks[0].name} 지연이 크므로 {topLeaks[0].name.includes("통관") ? "통관·검역 서류 사전 점검" : topLeaks[0].name.includes("항만") ? "하역 슬롯 선점" : "냉장차 배차 선점"} 권장
                  </div>
                )}
              </>
            ) : (
              <p style={{ margin: 0, color: C.green }}>현재 리드타임에서 모든 FC가 안전 재고를 확보하고 있습니다. 결품 위험 없음.</p>
            )}
          </div>

          {/* AI 상세 진단 결과 (Claude API) — 규칙기반 진단 아래에 추가 표시 */}
          {(aiText || aiError) && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${C.grid}` }}>
              <div style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginBottom: 8 }}>✦ 요나 AI 상세 진단</div>
              {aiError ? (
                <p style={{ margin: 0, fontSize: 12, color: C.amber }}>{aiError}</p>
              ) : aiSections ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {aiSections.map((s, i) => (
                    <div key={i} style={{ background: C.panel2, borderRadius: 8, borderLeft: `2px solid ${s.color}`, padding: "9px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: s.color, letterSpacing: 0.4 }}>{s.title}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: C.text }}>{s.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {aiText.split(/(?<=[.!?。])\s+/).map((sent) => sent.trim()).filter(Boolean).map((sent, i) => (
                    <p key={i} style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: C.text }}>{sent}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ⑤ 선제 조치 (Prescriptive) — 알림에서 끝내지 않고 바로 실행 */}
      <Section>
        <Header label="⑤ 선제 조치 · Prescriptive — 보고 바로 누른다">
          {actionLog.length > 0 && <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>✓ {actionLog.length}건 실행됨</span>}
        </Header>
        {actionItems.length === 0 ? (
          <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
            현재 권장 조치 없음 — 위험 BL을 조회하거나 리스크를 올리면 AI가 선제 조치를 제안합니다.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10, marginTop: 4 }}>
            {actionItems.map((item) => {
              const done = actionLog.some((l) => l.id === item.id);
              const uc = item.urgency === "high" ? C.red : C.amber;
              return (
                <div key={item.id} style={{ background: C.panel2, border: `1px solid ${C.grid}`, borderLeft: `3px solid ${uc}`,
                  borderRadius: 8, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.dim }}>근거 · {item.basis}</div>
                  {item.lines && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {item.lines.map((ln, i) => (<div key={i} style={{ fontSize: 11, color: C.text }}>· {ln}</div>))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: C.green }}>기대효과 · {item.effect}</div>
                  <button onClick={() => runAction(item)} disabled={done} style={{
                    marginTop: 2, border: "none", borderRadius: 6, padding: "8px 12px", fontSize: 12, fontWeight: 700,
                    cursor: done ? "default" : "pointer",
                    background: done ? `${C.green}1a` : uc, color: done ? C.green : "#fff",
                  }}>
                    {done ? "✓ 실행됨" : `${item.cta} ▶`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {actionLog.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.grid}` }}>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 5 }}>실행 로그</div>
            {actionLog.map((l, i) => (
              <div key={i} style={{ fontSize: 12, color: C.text, marginBottom: 3 }}>
                <span style={{ color: C.green }}>✓</span> {l.icon} {l.title} <span style={{ color: C.dim }}>— 실행 요청 전송됨</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 10, color: C.dim }}>
          데모 환경 — 실제 운영 시 자사 WMS 입고예약·발주·운송 배차 API로 실행됩니다.
        </div>
      </Section>

      {/* ⑥ 비용 임팩트 · Before vs After */}
      <Section>
        <Header label="⑥ 비용 임팩트 · 개입 전 vs FreshFlow 적용 후">
          <span style={{ fontSize: 11, color: C.dim }}>
            {selectedBl ? `${selectedBl.item} · 단가 ${fmtWon(price)}/개` : `단가 ${fmtWon(price)}/개 (기본)`}
          </span>
        </Header>

        {/* 헤드라인 KPI (큰 숫자) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 6 }}>
          <Stat label="FreshFlow 적용 전" value={fmtMan(costBefore.total)} sub={fmtWon(costBefore.total)} color={C.red} />
          <Stat label="FreshFlow 적용 후" value={fmtMan(costAfter.total)} sub={fmtWon(costAfter.total)} color={C.amber} />
          <Stat label={`절감액 (${savedPct}%↓)`} value={fmtMan(costSaved)} sub={fmtWon(costSaved)} color={C.green} big />
        </div>

        {/* 손실 항목별 Before/After 비교 */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { name: "결품 예상손실", b: costBefore.stockoutCost, a: costAfter.stockoutCost, bu: costBefore.stockoutUnits, au: costAfter.stockoutUnits },
            { name: "재고폐기 예상손실", b: costBefore.spoilCost, a: costAfter.spoilCost, bu: costBefore.overUnits, au: costAfter.overUnits },
          ].map((row) => {
            const max = Math.max(row.b, row.a, 1);
            return (
              <div key={row.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{row.name}</span>
                  <span style={{ color: C.dim }}>적용 전 {row.bu.toLocaleString()}개 → 후 {row.au.toLocaleString()}개</span>
                </div>
                <ComparBar label="적용전" val={row.b} max={max} color={C.red} />
                <ComparBar label="적용후" val={row.a} max={max} color={C.green} />
              </div>
            );
          })}
        </div>

        {/* 운송비 — FreshFlow가 선제조치(배치·이관)에 투입하는 비용 */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.grid}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>＋ 운송비 투입</span>
            <span style={{ color: C.dim, fontSize: 11 }}> (선제배치 {costAfter.placedUnits.toLocaleString()}개 · 과재고 이관 {costAfter.movedUnits.toLocaleString()}개)</span>
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.amber, fontFamily: "'IBM Plex Mono', monospace" }}>{fmtWon(costAfter.transportCost)}</span>
        </div>

        <div style={{ marginTop: 12, fontSize: 10, color: C.dim }}>
          가정 — 결품 예상손실 = 부족분 × 단가 × 마진율 {Math.round(COST.lostMargin * 100)}% · 재고폐기 예상손실(선제조치 안 할 경우) = 목표초과 잉여 × 단가 × 폐기율 {Math.round(COST.spoilRate * 100)}% · 운송비 = 배치 {fmtWon(COST.inbound)}/개 + 이관 {fmtWon(COST.transfer)}/개. 이 화물 1건 기준 · 실데이터 연동 시 정밀화.
        </div>
      </Section>
    </div>
  );
}

// ── UI 헬퍼 ──────────────────────────────────────────────────
function Legend({ dot, text }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, display: "inline-block" }} />
      {text}
    </span>
  );
}
function Section({ children, noMargin }) {
  return <div style={{ background: C.panel, border: `1px solid ${C.grid}`, borderRadius: 16, padding: "22px 24px", marginBottom: noMargin ? 0 : 16, boxShadow: C.shadow }}>{children}</div>;
}
function Stat({ label, value, sub, color, big }) {
  return (
    <div style={{ background: C.panel2, border: `1px solid ${C.grid}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: big ? 28 : 22, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 3, fontFamily: "'IBM Plex Mono', monospace" }}>{sub}</div>
    </div>
  );
}
function ComparBar({ label, val, max, color }) {
  const w = (val / max) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 10, color: C.dim, width: 38, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 16, background: C.panel2, border: `1px solid ${C.grid}`, borderRadius: 4, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${w}%`, background: color, opacity: 0.85 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, width: 96, textAlign: "right", flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace" }}>{fmtWon(val)}</span>
    </div>
  );
}
function Header({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, letterSpacing: -0.2 }}>{label}</span>
      {children}
    </div>
  );
}
function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", border: `0.5px solid ${C.grid}`, borderRadius: 6, overflow: "hidden" }}>
      {options.map(([val, lbl, col]) => (
        <button key={val} onClick={() => onChange(val)} style={{
          border: "none", padding: "5px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer",
          background: value === val ? col : "transparent",
          color: value === val ? "#fff" : C.dim,
        }}>{lbl}</button>
      ))}
    </div>
  );
}
