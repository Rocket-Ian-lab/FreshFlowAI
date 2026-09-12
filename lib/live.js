// lib/live.js — 실데이터 어댑터 레이어 (CLAUDE.md §5)
// 원칙: 엔진 인터페이스(risk{cong,cust,wx,dock} 0~1, stage)는 그대로, 데이터 소스만 교체.
// 순수 정규화 함수(weatherToWx, parseUnipass, kmaBase)는 test_liveadapter.mjs로 검증.
// server.js(로컬)와 api/live.js(Vercel)가 getLive()를 공용으로 사용.
// 키 없음/실패는 소스별 status로 정직하게 표기하고, 나머지 소스는 계속 살린다(데모 안 멈춤).

export const INCHEON_GRID = { nx: 55, ny: 124 }; // 기상청 격자: 인천
export const KMA_STN_ID = 109;                   // 특보 발표구역: 서울·인천·경기

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// 초단기실황은 매시 40분 발표 → KST 기준 45분 전 시각의 정시를 base로 사용
export function kmaBase(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000 - 45 * 60 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return {
    base_date: `${kst.getUTCFullYear()}${p(kst.getUTCMonth() + 1)}${p(kst.getUTCDate())}`,
    base_time: `${p(kst.getUTCHours())}00`,
  };
}

// 기상청 초단기실황 items(category/obsrValue) + 특보 제목 → 기상 리스크 0~1
// 명시적 휴리스틱(정직성): 강수·풍속·기온·눈·특보 가산, 상한 1.0
export function weatherToWx(items = [], warnTitles = []) {
  const get = (cat) => { const it = items.find((i) => i.category === cat); return it ? Number(it.obsrValue) : null; };
  const rain = get("RN1"), wind = get("WSD"), temp = get("T1H"), pty = get("PTY");
  let s = 0.05; const why = [];
  if (rain != null) {
    if (rain >= 10) { s += 0.35; why.push(`강수 ${rain}mm/h(강함)`); }
    else if (rain >= 3) { s += 0.2; why.push(`강수 ${rain}mm/h`); }
    else if (rain > 0) { s += 0.1; why.push(`강수 ${rain}mm/h`); }
    else why.push("강수 0mm");
  }
  if (wind != null) {
    if (wind >= 14) { s += 0.35; why.push(`풍속 ${wind}m/s(강풍)`); }
    else if (wind >= 9) { s += 0.2; why.push(`풍속 ${wind}m/s`); }
    else if (wind >= 6) { s += 0.1; why.push(`풍속 ${wind}m/s`); }
    else why.push(`풍속 ${wind}m/s`);
  }
  if (temp != null) {
    if (temp >= 33) { s += 0.15; why.push(`기온 ${temp}℃(폭염)`); }
    else if (temp <= -10) { s += 0.1; why.push(`기온 ${temp}℃(한파)`); }
    else why.push(`기온 ${temp}℃`);
  }
  if (pty === 3) { s += 0.1; why.push("눈"); }
  const KW = ["태풍", "풍랑", "강풍", "호우", "대설", "폭염", "한파"];
  const hits = KW.filter((k) => warnTitles.some((t) => String(t).includes(k)));
  if (hits.length) { s += Math.min(0.25 + 0.05 * (hits.length - 1), 0.4); why.push(`특보: ${hits.join("·")}`); }
  else why.push("특보 없음");
  return { wx: Math.round(clamp01(s) * 100) / 100, detail: why.join(" · ") };
}

// UNI-PASS 화물통관진행정보 XML → 단계(stage)/통관리스크(cust). 필드명 변동에 강한 관용 파서.
const tag = (xml, name) => [...xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "g"))].map((m) => m[1].trim());
export function parseUnipass(xml = "") {
  const notice = tag(xml, "ntceInfo")[0];
  const tCnt = Number(tag(xml, "tCnt")[0] ?? 0);
  if (notice && (tCnt < 0 || /인증키|오류|error/i.test(notice))) return { ok: false, status: "error", detail: notice };
  if (tCnt === 0) return { ok: false, status: "notfound", detail: "UNI-PASS에 해당 BL/화물관리번호 없음" };
  const stts = tag(xml, "csclPrgsStts")[0] || "";
  const steps = tag(xml, "cargTrcnRelaBsopTpcd");
  const latest = steps[steps.length - 1] || stts;
  const text = `${stts} ${steps.join(" ")}`;
  let stage = "customs", cust = 0.3;
  if (/반출|수리/.test(latest)) { stage = "release"; cust = 0.15; }
  else if (/검사|검역|보류|정정|서류|미결/.test(text)) { stage = "customs"; cust = 0.6; }
  else if (/수입신고|심사|접수/.test(text)) { stage = "customs"; cust = 0.35; }
  else if (/입항|하선|반입|양하/.test(text)) { stage = "port"; cust = 0.25; }
  return { ok: true, status: "live", stage, cust, detail: `${stts || "진행중"}${latest ? ` · 최근: ${latest}` : ""}` };
}

// ── 네트워크 ─────────────────────────────────────────────────
const withTimeout = async (url, ms = 8000) => {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { signal: ac.signal }); } finally { clearTimeout(t); }
};
// 공공데이터포털 서비스키는 '인코딩키'(%포함)와 '디코딩키' 둘 다 허용
const svcKey = (k) => (k.includes("%") ? k : encodeURIComponent(k));

export async function fetchKma(key) {
  const { base_date, base_time } = kmaBase();
  const q = `serviceKey=${svcKey(key)}&pageNo=1&numOfRows=20&dataType=JSON`;
  const ncstUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?${q}&base_date=${base_date}&base_time=${base_time}&nx=${INCHEON_GRID.nx}&ny=${INCHEON_GRID.ny}`;
  const warnUrl = `https://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrWrnList?${q}&stnId=${KMA_STN_ID}`;
  const [n, w] = await Promise.allSettled([
    withTimeout(ncstUrl).then((r) => r.json()),
    withTimeout(warnUrl).then((r) => r.json()),
  ]);
  if (n.status !== "fulfilled") throw new Error("기상청 실황 요청 실패");
  const nj = n.value;
  const items = nj?.response?.body?.items?.item;
  if (!Array.isArray(items)) {
    throw new Error(nj?.OpenAPI_ServiceResponse?.cmmMsgHeader?.returnAuthMsg || nj?.response?.header?.resultMsg || "기상청 응답 형식 오류");
  }
  const wItems = w.status === "fulfilled" ? (w.value?.response?.body?.items?.item || []) : [];
  return { items, warnTitles: (Array.isArray(wItems) ? wItems : []).map((i) => i.title || ""), base_date, base_time };
}

export async function fetchUnipass(key, bl) {
  const yy = String(new Date().getFullYear());
  const base = `https://unipass.customs.go.kr:38010/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo?crkyCn=${encodeURIComponent(key)}&blYy=${yy}`;
  let p = parseUnipass(await withTimeout(`${base}&mblNo=${encodeURIComponent(bl)}`).then((r) => r.text()));
  if (p.status === "notfound") p = parseUnipass(await withTimeout(`${base}&hblNo=${encodeURIComponent(bl)}`).then((r) => r.text())); // House BL 재시도
  return p;
}

// 통합 조회: 소스별 독립 실행. 키 없음→nokey, 실패→error, 성공→live. 항만/Dock은 미연동(unavailable).
export async function getLive(env = {}, { bl } = {}) {
  const src = {
    wx: "기상청 초단기실황·기상특보 (공공데이터포털)",
    cust: "관세청 UNI-PASS 화물통관진행정보",
    cong: "해수부 Port-MIS (항만)",
    dock: "자사 WMS Dock",
  };
  const out = {
    fetchedAt: new Date().toISOString(),
    risks: { cong: null, cust: null, wx: null, dock: null },
    stage: null,
    sources: {
      wx:   { status: "nokey", src: src.wx, detail: "DATA_GO_KR_KEY 미설정 — 시뮬레이션 값 유지" },
      cust: { status: "nokey", src: src.cust, detail: "UNIPASS_KEY 미설정 — 시뮬레이션 값 유지" },
      cong: { status: "unavailable", src: src.cong, detail: "Port-MIS 데이터셋 키/엔드포인트 설정 필요 — 시뮬레이션 값 유지" },
      dock: { status: "unavailable", src: src.dock, detail: "자사 WMS 연동 필요 — 시뮬레이션 값 유지" },
    },
  };
  if (env.DATA_GO_KR_KEY) {
    try {
      const k = await fetchKma(env.DATA_GO_KR_KEY);
      const r = weatherToWx(k.items, k.warnTitles);
      out.risks.wx = r.wx;
      out.sources.wx = { status: "live", src: src.wx, detail: `인천 ${k.base_time.slice(0, 2)}시 실황 — ${r.detail}` };
    } catch (e) { out.sources.wx = { status: "error", src: src.wx, detail: String(e?.message || e) }; }
  }
  if (env.UNIPASS_KEY) {
    if (!bl) out.sources.cust = { status: "error", src: src.cust, detail: "조회할 BL이 없습니다 — ⓪에서 BL을 선택하세요" };
    else {
      try {
        const p = await fetchUnipass(env.UNIPASS_KEY, bl);
        if (p.ok) { out.risks.cust = p.cust; out.stage = p.stage; }
        out.sources.cust = { status: p.status, src: src.cust, detail: p.detail };
      } catch (e) { out.sources.cust = { status: "error", src: src.cust, detail: String(e?.message || e) }; }
    }
  }
  return out;
}
