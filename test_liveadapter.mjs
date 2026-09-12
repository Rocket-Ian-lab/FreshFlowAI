// 실데이터 어댑터(lib/live.js) 순수 정규화 함수 검증 — 네트워크 없이 샘플 페이로드로 (개발원칙 2)
import { weatherToWx, parseUnipass, kmaBase } from "./lib/live.js";

let fails = 0;
const check = (name, cond, info = "") => { console.log(`${cond ? "✅" : "❌"} ${name}${info ? " — " + info : ""}`); if (!cond) fails++; };

// 1) 기상 → wx
const calm = [{ category: "RN1", obsrValue: "0" }, { category: "WSD", obsrValue: "2.4" }, { category: "T1H", obsrValue: "22.1" }, { category: "PTY", obsrValue: "0" }];
const storm = [{ category: "RN1", obsrValue: "12.5" }, { category: "WSD", obsrValue: "15.2" }, { category: "T1H", obsrValue: "24.0" }, { category: "PTY", obsrValue: "1" }];
const heat = [{ category: "RN1", obsrValue: "0" }, { category: "WSD", obsrValue: "3.0" }, { category: "T1H", obsrValue: "34.5" }, { category: "PTY", obsrValue: "0" }];
const c = weatherToWx(calm, []), s = weatherToWx(storm, []), st = weatherToWx(storm, ["태풍경보 발표", "강풍주의보 발표"]), h = weatherToWx(heat, ["폭염경보 발표"]);
check("평온: wx 낮음(≤0.15)", c.wx <= 0.15, `wx=${c.wx} · ${c.detail}`);
check("폭우+강풍: wx 높음(≥0.7)", s.wx >= 0.7, `wx=${s.wx} · ${s.detail}`);
check("태풍·강풍 특보 가산 & 상한 1.0", st.wx > s.wx && st.wx <= 1, `wx=${st.wx} · ${st.detail}`);
check("폭염+특보: 콜드체인 리스크 반영", h.wx >= 0.4 && h.detail.includes("폭염"), `wx=${h.wx} · ${h.detail}`);
check("단조성: 평온 < 폭우 < 폭우+특보", c.wx < s.wx && s.wx < st.wx);

// 2) UNI-PASS XML → stage/cust
const errXml = `<?xml version="1.0"?><cargCsclPrgsInfoQryRtnVo><ntceInfo>존재하지 않는 인증키입니다.</ntceInfo><tCnt>-1</tCnt></cargCsclPrgsInfoQryRtnVo>`;
const noneXml = `<cargCsclPrgsInfoQryRtnVo><tCnt>0</tCnt></cargCsclPrgsInfoQryRtnVo>`;
const inspXml = `<cargCsclPrgsInfoQryRtnVo><tCnt>1</tCnt><cargCsclPrgsInfoQryVo><csclPrgsStts>수입신고 진행중</csclPrgsStts></cargCsclPrgsInfoQryVo>
<cargCsclPrgsInfoDtlQryVo><cargTrcnRelaBsopTpcd>입항보고</cargTrcnRelaBsopTpcd></cargCsclPrgsInfoDtlQryVo>
<cargCsclPrgsInfoDtlQryVo><cargTrcnRelaBsopTpcd>수입신고</cargTrcnRelaBsopTpcd></cargCsclPrgsInfoDtlQryVo>
<cargCsclPrgsInfoDtlQryVo><cargTrcnRelaBsopTpcd>검사대상 선별</cargTrcnRelaBsopTpcd></cargCsclPrgsInfoDtlQryVo></cargCsclPrgsInfoQryRtnVo>`;
const doneXml = `<cargCsclPrgsInfoQryRtnVo><tCnt>1</tCnt><cargCsclPrgsInfoQryVo><csclPrgsStts>수입신고 수리</csclPrgsStts></cargCsclPrgsInfoQryVo>
<cargCsclPrgsInfoDtlQryVo><cargTrcnRelaBsopTpcd>수입신고</cargTrcnRelaBsopTpcd></cargCsclPrgsInfoDtlQryVo>
<cargCsclPrgsInfoDtlQryVo><cargTrcnRelaBsopTpcd>수입신고수리</cargTrcnRelaBsopTpcd></cargCsclPrgsInfoDtlQryVo></cargCsclPrgsInfoQryRtnVo>`;
const portXml = `<cargCsclPrgsInfoQryRtnVo><tCnt>1</tCnt><cargCsclPrgsInfoQryVo><csclPrgsStts>입항</csclPrgsStts></cargCsclPrgsInfoQryVo>
<cargCsclPrgsInfoDtlQryVo><cargTrcnRelaBsopTpcd>입항보고</cargTrcnRelaBsopTpcd></cargCsclPrgsInfoDtlQryVo></cargCsclPrgsInfoQryRtnVo>`;
const pe = parseUnipass(errXml), pn = parseUnipass(noneXml), pi = parseUnipass(inspXml), pd = parseUnipass(doneXml), pp = parseUnipass(portXml);
check("인증키 오류 → status error", pe.status === "error" && /인증키/.test(pe.detail), pe.detail);
check("BL 없음(tCnt=0) → notfound", pn.status === "notfound");
check("검사대상 → customs, cust 0.6", pi.ok && pi.stage === "customs" && pi.cust === 0.6, pi.detail);
check("수입신고수리 → release, cust 0.15", pd.ok && pd.stage === "release" && pd.cust === 0.15, pd.detail);
check("입항보고 → port", pp.ok && pp.stage === "port", pp.detail);

// 3) base_date/time 포맷 (KST, 45분 전 정시)
const b = kmaBase(new Date("2026-09-12T00:10:00Z")); // KST 09:10 → 08:25 → base 0800
check("kmaBase 포맷 YYYYMMDD/HH00", /^\d{8}$/.test(b.base_date) && /^\d{2}00$/.test(b.base_time), `${b.base_date} ${b.base_time}`);
check("kmaBase 45분 전 정시 반영(09:10 KST → 0800)", b.base_time === "0800" && b.base_date === "20260912");

console.log(fails ? `\n${fails}개 실패` : "\n모든 검증 통과");
process.exit(fails ? 1 : 0);
