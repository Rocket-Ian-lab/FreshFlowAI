// 실데이터 어댑터(lib/live.js) 순수 정규화 함수 검증 — 네트워크 없이 샘플 페이로드로 (개발원칙 2)
import { weatherToWx, parseUnipass, kmaBase, unipassEvents, unipassTimeline } from "./lib/live.js";

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

// 2-B) 실제 UNI-PASS 응답 형태 회귀 — 오픈소스 node-unipass fixtures(실제 응답)의 단계명·처리일시를 그대로 쓰고 식별자만 마스킹
//  검증 포인트: 이력은 최신순(역순)으로 온다 / '운항정보 정정'은 일상 이벤트 / 신고가 반입보다 먼저일 수 있다 / MBL 다건 응답
const dtl = (step, at, note = "") => `<cargCsclPrgsInfoDtlQryVo><shedNm>인천세관 지정장치장</shedNm><prcsDttm>${at}</prcsDttm><dclrNo>XXXX</dclrNo><cargTrcnRelaBsopTpcd>${step}</cargTrcnRelaBsopTpcd><rlbrCn>${note}</rlbrCn></cargCsclPrgsInfoDtlQryVo>`;
const wrap = (stts, evNewestFirst) => `<cargCsclPrgsInfoQryRtnVo><ntceInfo></ntceInfo><cargCsclPrgsInfoQryVo><csclPrgsStts>${stts}</csclPrgsStts><etprDt>20200604</etprDt></cargCsclPrgsInfoQryVo><tCnt>${evNewestFirst.length}</tCnt>${evNewestFirst.join("")}</cargCsclPrgsInfoQryRtnVo>`;
const seaEvents = [ // 해상(웨이하이→인천) 실제 이력, 최신순
  dtl("하선장소 반입기간연장 승인", "20200610165832"),
  dtl("하선장소 반입기간연장 승인신청", "20200610161447"),
  dtl("통관목록심사완료", "20200610105437"),
  dtl("반출신고", "20200610105437", "목록통관특송물품 반출"),
  dtl("반입신고", "20200610105436", "입항 반입"),
  dtl("하선장소 반입기간연장 승인", "20200604162629"),
  dtl("하선장소 반입기간연장 승인신청", "20200604155219"),
  dtl("통관목록접수", "20200604111840"),
  dtl("하선신고 수리", "20200604110220"),
  dtl("입항적하목록 운항정보 정정", "20200604103755"),
  dtl("입항보고 수리", "20200604103755"),
  dtl("입항적하목록 심사완료", "20200603225007"),
  dtl("입항적하목록 제출", "20200603213214"),
];
const seaDone = wrap("통관목록심사완료", seaEvents);
const seaWaiting = wrap("", seaEvents.slice(5));          // 6/4 16:26 시점: 접수됨, 반입 전
const airEvents = [ // 항공(런던→인천) 실제 이력: 수입신고가 입항보고 수리보다 먼저, 수리까지 2일 지연
  dtl("수입신고수리", "20171211174500"),
  dtl("반입신고", "20171209112100", "입항 반입"),
  dtl("하기신고 수리", "20171208160200"),
  dtl("입항보고 수리", "20171208151000"),
  dtl("입항적하목록 운항정보 정정", "20171208151000"),
  dtl("수입(사용소비) 결재통보", "20171208143900"),
  dtl("수입(사용소비) 심사진행", "20171208141000"),
  dtl("수입신고", "20171208141000"),
  dtl("입항적하목록 제출", "20171208131600"),
  dtl("입항보고 제출", "20171208085200"),
];
const airAccepted = wrap("수입신고수리", airEvents);
const multiXml = `<cargCsclPrgsInfoQryRtnVo><ntceInfo>[N00] 조회 결과가 다건입니다. 상세내역조회를 위해서는 화물관리번호(cargMtNo)로 조회하시기 바랍니다.</ntceInfo><cargCsclPrgsInfoQryVo><hblNo>X1</hblNo></cargCsclPrgsInfoQryVo><cargCsclPrgsInfoQryVo><hblNo>X2</hblNo></cargCsclPrgsInfoQryVo><tCnt>1211</tCnt></cargCsclPrgsInfoQryRtnVo>`;

const evs = unipassEvents(seaDone);
check("이력 시간순 정렬(응답은 최신순)", evs[0].step === "입항적하목록 제출" && evs[evs.length - 1].step === "하선장소 반입기간연장 승인", `${evs.length}건`);
const sd = parseUnipass(seaDone);
check("반출 완료 화물 → inland·cust 0.1 ('운항정보 정정'을 리스크로 오인하지 않음)", sd.ok && sd.stage === "inland" && sd.cust === 0.1, sd.detail);
const tl = unipassTimeline(seaDone);
check("구간 실측: 입항→반입 144.28h, 입항→반출 144.28h(6.0일)", tl.hours.portToShed === 144.28 && tl.hours.total === 144.28, JSON.stringify(tl.hours));
check("지연 선행신호: 반입기간연장 2회·입항 전(반입 전) 신고", tl.signals.extension === 2 && tl.signals.preDeclared === true && tl.signals.inspection === false, JSON.stringify(tl.signals));
const sw = parseUnipass(seaWaiting);
check("반입 대기 중(접수됨) → customs·0.35, 미완 구간은 null", sw.stage === "customs" && sw.cust === 0.35 && sw.timeline.hours.total === null && sw.timeline.signals.extension === 1, sw.detail);
const aa = parseUnipass(airAccepted);
check("신고가 입항보다 먼저여도 수리 완료 → release·0.15", aa.stage === "release" && aa.cust === 0.15, aa.detail);
check("항공: 반입→수리 54.4h(2.3일) 지연 포착, 반출 전이라 total null", aa.timeline.hours.shedToAccept === 54.4 && aa.timeline.hours.total === null, JSON.stringify(aa.timeline.hours));
const pm = parseUnipass(multiXml);
check("MBL 다건([N00]) → 화물관리번호 재조회 안내", pm.status === "error" && /1211건/.test(pm.detail), pm.detail);

// 3) base_date/time 포맷 (KST, 45분 전 정시)
const b = kmaBase(new Date("2026-09-12T00:10:00Z")); // KST 09:10 → 08:25 → base 0800
check("kmaBase 포맷 YYYYMMDD/HH00", /^\d{8}$/.test(b.base_date) && /^\d{2}00$/.test(b.base_time), `${b.base_date} ${b.base_time}`);
check("kmaBase 45분 전 정시 반영(09:10 KST → 0800)", b.base_time === "0800" && b.base_date === "20260912");

console.log(fails ? `\n${fails}개 실패` : "\n모든 검증 통과");
process.exit(fails ? 1 : 0);
