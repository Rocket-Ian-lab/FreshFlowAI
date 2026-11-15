// FreshFlow AI 발표 PPT 생성기 — 슬라이드마다 헤드라인 → Context → 상세 (메시지 1개)
// 실행: node tools/build_ppt.cjs   (pptxgenjs 필요: npm install pptxgenjs --no-save)
// 출력: FreshFlow_홍보PPT.pptx (환경변수 OUT으로 경로 변경 가능)
const path = require("path");
const fs = require("fs");
const ROOT = path.resolve(__dirname, "..");
const pptxgen = require(path.join(ROOT, "node_modules", "pptxgenjs"));
const JSZip = require(path.join(ROOT, "node_modules", "jszip"));
const OUT = process.env.OUT || path.join(ROOT, "FreshFlow_홍보PPT.pptx");

// ── Toss 팔레트 (대시보드 토큰과 동일) ──
const THEME = {
  name: "FreshFlow Toss",
  headFontFace: "Malgun Gothic",
  bodyFontFace: "Malgun Gothic",
  colors: {
    dk1: "191F28", lt1: "FFFFFF", dk2: "6B7684", lt2: "F2F4F6",
    accent1: "3182F6", accent2: "F04452", accent3: "FF9500", accent4: "00B26C", accent5: "E5E8EB", accent6: "1B64DA",
    hlink: "3182F6", folHlink: "6B7684",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = "Rocket_Ian_Lab";
pres.company = "Rocket_Ian_Lab";
pres.title = "FreshFlow AI — 콜드체인 Port-to-FC 관제탑";
pres.subject = "발표 자료";
const C = pres.SchemeColor;
const W = 10, H = 5.625, MX = 0.6;

// ── 레이아웃 ──
pres.defineSlideMaster({
  title: "DARK",
  background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: MX, y: 1.55, w: W - 2 * MX, h: 1.6, fontSize: 40, bold: true, color: C.background1, align: "left", valign: "bottom", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: MX, y: 3.25, w: W - 2 * MX, h: 0.9, fontSize: 16, color: "B0B8C1", valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: HEX.lt2 },
  objects: [
    { rect: { x: 0, y: 0, w: W, h: 0.08, fill: { color: HEX.accent1 } } },
    { placeholder: { options: { name: "kicker", type: "body", x: MX, y: 0.28, w: 6, h: 0.3, fontSize: 10.5, bold: true, color: C.accent1, charSpacing: 2, margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: MX, y: 0.55, w: W - 2 * MX, h: 0.8, fontSize: 23, bold: true, color: C.text1, align: "left", valign: "top", margin: 0 }, text: "" } },
    { rect: { x: MX, y: 1.42, w: 0.78, h: 0.3, fill: { color: HEX.lt1 }, line: { color: HEX.accent5, width: 0.75 } } },
    { text: { text: "Context", options: { x: MX, y: 1.42, w: 0.78, h: 0.3, fontSize: 9.5, bold: true, color: HEX.dk2, align: "center", valign: "middle", margin: 0 } } },
    { placeholder: { options: { name: "context", type: "body", x: MX + 0.9, y: 1.36, w: W - 2 * MX - 0.9, h: 0.42, fontSize: 11.5, color: C.text2, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "FreshFlow AI  ·  Rocket_Ian_Lab", options: { x: MX, y: H - 0.38, w: 5, h: 0.25, fontSize: 9, color: HEX.dk2, margin: 0 } } },
    { text: { text: "fresh-flow-ai.vercel.app", options: { x: W - MX - 3, y: H - 0.38, w: 2.55, h: 0.25, fontSize: 9, color: HEX.dk2, align: "right", margin: 0 } } },
  ],
  slideNumber: { x: W - MX - 0.4, y: H - 0.38, w: 0.4, h: 0.25, fontSize: 9, color: HEX.dk2, align: "right" },
});

// ── 헬퍼 ──
const DY = 1.95;            // 상세영역 시작 y
const DH = H - DY - 0.55;   // 상세영역 높이 (≈3.1)
let n = 0;
const nm = (s) => `${s}_${++n}`;

function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: opts.fill || HEX.lt1 }, line: { color: opts.line || HEX.accent5, width: 0.75 }, objectName: nm("card") });
}
function circleNum(slide, x, y, label, color = HEX.accent1, d = 0.42) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { color, width: 0 }, objectName: nm("icon") });
  slide.addText(label, { x, y, w: d, h: d, fontSize: d > 0.4 ? 12 : 10, bold: true, color: HEX.lt1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: nm("iconLabel") });
}
function txt(slide, text, o) {
  slide.addText(text, Object.assign({ isTextBox: true, margin: 0, objectName: nm("text") }, o));
}
function stat(slide, x, y, w, value, label, color = HEX.accent1, size = 30) {
  txt(slide, value, { x, y, w, h: 0.6, fontSize: size, bold: true, color, align: "left", valign: "bottom" });
  txt(slide, label, { x, y: y + 0.62, w, h: 0.5, fontSize: 10.5, color: HEX.dk2, valign: "top" });
}
function infoCard(slide, x, y, w, h, icon, title, desc, color = HEX.accent1) {
  card(slide, x, y, w, h);
  circleNum(slide, x + 0.2, y + 0.2, icon, color, 0.4);
  txt(slide, title, { x: x + 0.2, y: y + 0.7, w: w - 0.4, h: 0.4, fontSize: 13.5, bold: true, color: HEX.dk1, valign: "top" });
  txt(slide, desc, { x: x + 0.2, y: y + 1.1, w: w - 0.4, h: h - 1.25, fontSize: 10.5, color: HEX.dk2, valign: "top", paraSpaceAfter: 3 });
}
function pill(slide, x, y, w, text, color, h = 0.28, size = 9.5) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.14, fill: { color }, line: { color, width: 0 }, objectName: nm("pill") });
  txt(slide, text, { x, y, w, h, fontSize: size, bold: true, color: HEX.lt1, align: "center", valign: "middle" });
}
function bar(slide, x, y, w, h, color) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color }, line: { color, width: 0 }, objectName: nm("bar") });
}
function bullets(slide, items, o) {
  slide.addText(items.map((it, k) => ({ text: it, options: { bullet: { indent: 11 }, breakLine: k < items.length - 1 } })), Object.assign({ valign: "top", paraSpaceAfter: 4, margin: 0, isTextBox: true, objectName: nm("list") }, o));
}
function contentSlide(section, kicker, title, context, notes) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(kicker, { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  s.addText(context, { placeholder: "context" });
  if (notes) s.addNotes(notes);
  return s;
}
function arrow(slide, x, y, w = 0.3, color = HEX.dk2) {
  slide.addShape(pres.shapes.RIGHT_ARROW, { x, y, w, h: 0.22, fill: { color }, line: { color, width: 0 }, objectName: nm("arrow") });
}

// ════════════ 1. 타이틀 ════════════
pres.addSection({ title: "오프닝" });
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "오프닝" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: 0.62, w: 0.62, h: 0.62, rectRadius: 0.14, fill: { color: HEX.accent1 }, line: { color: HEX.accent1, width: 0 }, objectName: "logoBox" });
  s.addShape(pres.shapes.OVAL, { x: MX + 0.12, y: 0.86, w: 0.12, h: 0.12, fill: { color: HEX.lt1 }, line: { color: HEX.lt1, width: 0 }, objectName: "logoDot1" });
  s.addShape(pres.shapes.LINE, { x: MX + 0.24, y: 0.92, w: 0.26, h: 0, line: { color: HEX.lt1, width: 1.5 }, objectName: "logoLine" });
  s.addShape(pres.shapes.OVAL, { x: MX + 0.38, y: 0.86, w: 0.12, h: 0.12, fill: { color: HEX.lt1 }, line: { color: HEX.lt1, width: 0 }, objectName: "logoDot2" });
  txt(s, "FreshFlow AI", { x: MX + 0.78, y: 0.62, w: 5, h: 0.62, fontSize: 22, bold: true, color: HEX.lt1, valign: "middle" });
  txt(s, "콜드체인 Port-to-FC 관제탑", { x: MX, y: 1.3, w: 6, h: 0.3, fontSize: 12, color: "B0B8C1" });
  s.addText("정보를 조회하고 분석은 AI가,\n판단은 사람이.", { placeholder: "title" });
  s.addText("수입 신선식품이 '언제 FC에 입고되어 팔 수 있는 재고가 되는가'를 예측하고, FC별 결품·폐기를 선제배치로 막는 SCM 의사결정 도구", { placeholder: "body" });
  ["입고 예측", "조기경보", "선제배치", "비용 임팩트"].forEach((t, i) => pill(s, MX + i * 1.3, 4.45, 1.18, t, "2E3A4A"));
  txt(s, "fresh-flow-ai.vercel.app  ·  github.com/Rocket-Ian-lab/FreshFlowAI", { x: MX, y: 5.0, w: 8, h: 0.3, fontSize: 10, color: "8B95A1" });
  txt(s, "Rocket_Ian_Lab", { x: W - MX - 3, y: 5.0, w: 3, h: 0.3, fontSize: 10, bold: true, color: "B0B8C1", align: "right" });
  s.addNotes("오프닝. 핵심 슬로건: 정보 조회·분석은 AI가 대신하고 사람은 판단·실행만 한다. 모든 슬라이드는 '헤드라인 → Context → 상세' 구조.");
}

// ════════════ 2. 핵심 메시지 ════════════
{
  const s = contentSlide("오프닝", "핵심 메시지",
    "선박 ETA가 아니라, 'FC에서 팔 수 있는 시점'을 예측합니다",
    "기존 공급망 가시성 솔루션은 해상 운송과 ETA에서 출발해 기능을 넓히고 있습니다. FreshFlow는 한국 수입식품의 통관·검역 이력과 FC별 재고를 연결해 센터 간 재고 밸런싱까지 제안합니다.",
    "한 장 요약. FreshFlow가 하는 일 3가지(모은다·알아챈다·먼저 움직인다)와 숫자 4개. 숫자는 모두 시뮬레이션·비용모델 결과이며 실측이 아니다: 7.4h(합성 시계열 200회, test_earlywarn.mjs), 2→0(정적 재고 커버리지), 79~90%(비용모델: 정적 90%, 시간축 검증 79~88%, test_bridge.mjs), 0/200(정상 지속 시 오경보). 경쟁사는 '입항에서 끝난다'고 단정하지 않는다(Portcast는 주문·비용·AI 권고까지 확장).");
  const cols = [
    ["1", "모은다", "Port-MIS · UNI-PASS · 식약처 · WMS에 흩어진 데이터를 Port-to-FC 5구간 리드타임 하나로 통합", HEX.accent1],
    ["2", "알아챈다", "평소 패턴 대비 이탈을 z-score로 감지해 결품이 나기 전에 경보", HEX.accent3],
    ["3", "먼저 움직인다", "FC별 결품 위험을 진단하고 선제배치·이관을 계산, 담당자는 버튼만 누른다", HEX.accent4],
  ];
  const cw = 2.1, gap = 0.15;
  cols.forEach(([ic, t, d, col], i) => infoCard(s, MX + i * (cw + gap), DY, cw, 1.9, ic, t, d, col));
  const sx = MX + 3 * (cw + gap) + 0.05, sw = W - MX - sx;
  card(s, sx, DY, sw, DH, { fill: HEX.dk1, line: HEX.dk1 });
  [["7.4h", "경보 선행 평균 (시뮬레이션)"], ["2 → 0", "결품 High FC (정적 커버리지)"], ["79~90%", "예상손실 감소 (비용모델)"], ["0 / 200", "정상 상황 오경보 (시뮬레이션)"]].forEach(([v, l], i) => {
    txt(s, v, { x: sx + 0.18, y: DY + 0.12 + i * 0.74, w: sw - 0.3, h: 0.42, fontSize: 20, bold: true, color: HEX.lt1, valign: "bottom" });
    txt(s, l, { x: sx + 0.18, y: DY + 0.54 + i * 0.74, w: sw - 0.3, h: 0.22, fontSize: 8.5, color: "B0B8C1" });
  });
  txt(s, "※ 위기 시나리오(칠레산 체리 4,000개)의 시뮬레이션·비용모델 결과이며 실측이 아닙니다 — node test_*.mjs", { x: MX, y: DY + 2.05, w: 6.6, h: 0.3, fontSize: 9, color: HEX.dk2, italic: true });
  card(s, MX, DY + 2.4, 3 * (cw + gap) - gap, 0.62, { fill: "E8F3FF", line: "E8F3FF" });
  txt(s, "사람이 하던 자료 조회·정리·밸런싱 계산을 AI가 대신하고, 사람은 검토·실행만 — \"똘똘한 부하직원\"", { x: MX + 0.2, y: DY + 2.4, w: 3 * (cw + gap) - gap - 0.4, h: 0.62, fontSize: 11.5, bold: true, color: HEX.accent6, valign: "middle" });
}

// ════════════ 3. 문제 ════════════
pres.addSection({ title: "문제와 원인" });
{
  const s = contentSlide("문제와 원인", "01  문제",
    "FC가 늘어날수록, SCM 담당자 Ian은 자꾸 놓칩니다",
    "고객은 여러 물류센터(FC)를 운영하는 수입식품 유통사의 SCM Instock 담당. KPI는 결품률과 폐기율 — 어느 FC든 품절이나 과재고가 나면 책임은 그에게 옵니다.",
    "페르소나 Ian의 하루. FC가 두어 개일 땐 수기로 됐지만, 늘어나면서 조회·밸런싱 업무가 폭증하고 결품을 놓친다. 새벽 결품 연락이 상징적 장면.");
  const pains = [
    ["①", "입고 시점이 깜깜이", "입항·통관·반출·운송·입고 정보가 단계마다 다른 시스템에 흩어져, '언제 팔 수 있는 재고가 되는지' 아무도 한 화면으로 못 봅니다.", HEX.accent2],
    ["②", "수기 밸런싱의 한계", "FC별 재고를 일일이 조회해 엑셀로 이관량을 계산. 결품과 과재고(폐기) 사이의 균형을 사람이 매번 다시 맞춥니다.", HEX.accent3],
    ["③", "FC가 늘며 놓치는 빈도↑", "FC가 두어 개일 땐 됐지만 여러 개로 늘자 자꾸 놓침. 밸런싱용 운송 업무까지 폭증 — 새벽에 결품 연락을 받습니다.", HEX.accent6],
  ];
  const cw = 2.72, gap = 0.14;
  pains.forEach(([ic, t, d, col], i) => infoCard(s, MX + i * (cw + gap), DY, cw, 2.15, ic, t, d, col));
  card(s, MX, DY + 2.32, W - 2 * MX, 0.72, { fill: HEX.dk1, line: HEX.dk1 });
  txt(s, "\"FC 두 개일 땐 머리로 됐어요. 여섯 개가 되니 어느 센터가 먼저 비는지 매일 아침 처음부터 다시 조회해야 합니다.\"", { x: MX + 0.25, y: DY + 2.32, w: 5.9, h: 0.72, fontSize: 11.5, italic: true, color: HEX.lt1, valign: "middle" });
  txt(s, "— SCM Instock 담당 Ian (페르소나)", { x: MX + 6.4, y: DY + 2.32, w: W - 2 * MX - 6.6, h: 0.72, fontSize: 9.5, color: "B0B8C1", align: "right", valign: "middle" });
}

// ════════════ 4. 근본원인 ════════════
{
  const s = contentSlide("문제와 원인", "02  근본원인",
    "정보 단절은 재고 불균형을 늦게 발견하게 만듭니다",
    "결품의 원인은 수요 급증·공급 부족 등 여럿입니다. 그중 저희가 겨냥하는 것은 정보 단절입니다. 데이터가 기관별로 분절돼 통합된 입고 예측이 없고, 이상을 늦게 알아 대응이 늦어집니다.",
    "근본원인 체인. 분절된 4개 정보원 → 입고 예측 불가 → 조기감지 부재 → 늦은 대응 → 결품/폐기. 결품의 모든 원인이 정보 단절이라고 주장하지 않는다(수요 급증·공급 부족·배차 실패도 원인). FreshFlow가 겨냥하는 고리가 정보 단절이다.");
  const srcs = [["Port-MIS", "항만 입항·하역", "해양수산부"], ["UNI-PASS", "통관·검역 진행", "관세청"], ["수입식품정보마루", "검사·부적합 정보", "식약처"], ["WMS / TMS", "FC 입고·운송", "자사·운송사"]];
  srcs.forEach(([t, d, org], i) => {
    const y = DY + i * 0.74;
    card(s, MX, y, 2.6, 0.64);
    circleNum(s, MX + 0.14, y + 0.14, String(i + 1), HEX.dk2, 0.36);
    txt(s, t, { x: MX + 0.6, y: y + 0.08, w: 1.95, h: 0.26, fontSize: 11.5, bold: true, color: HEX.dk1 });
    txt(s, `${d} · ${org}`, { x: MX + 0.6, y: y + 0.34, w: 1.95, h: 0.24, fontSize: 9, color: HEX.dk2 });
  });
  txt(s, "기관별로 분절된 정보원", { x: MX, y: DY - 0.02 + 4 * 0.74, w: 2.6, h: 0.25, fontSize: 9.5, bold: true, color: HEX.dk2, align: "center" });
  const chain = [
    ["정보 단절", "항만·통관·운송·FC 데이터가 서로 연결되지 않음", HEX.accent2],
    ["입고 예측 부재", "'선박 도착'은 알아도 'FC 입고·판매가능 시점'은 추정", HEX.accent3],
    ["조기감지 불가", "평소 대비 이상 지연을 결품이 난 뒤에야 인지", HEX.accent3],
    ["늦은 대응 → 결품·폐기", "밸런싱 이관은 이미 늦고, 반대편 FC엔 과재고 폐기", HEX.dk1],
  ];
  const cx = MX + 3.15, cwid = W - MX - cx;
  chain.forEach(([t, d, col], i) => {
    const y = DY + i * 0.74;
    card(s, cx, y, cwid, 0.64, { line: i === 0 ? HEX.accent2 : HEX.accent5 });
    bar(s, cx, y, 0.08, 0.64, col);
    txt(s, t, { x: cx + 0.25, y: y + 0.08, w: cwid - 0.4, h: 0.26, fontSize: 12, bold: true, color: HEX.dk1 });
    txt(s, d, { x: cx + 0.25, y: y + 0.34, w: cwid - 0.4, h: 0.26, fontSize: 9.5, color: HEX.dk2 });
    if (i < 3) s.addShape(pres.shapes.DOWN_ARROW, { x: cx + cwid / 2 - 0.1, y: y + 0.62, w: 0.2, h: 0.14, fill: { color: HEX.dk2 }, line: { color: HEX.dk2, width: 0 }, objectName: nm("darrow") });
  });
  pill(s, cx + cwid - 3.4, DY - 0.02 + 4 * 0.74, 3.4, "FreshFlow는 첫 고리 '정보 단절'을 끊습니다", HEX.accent1, 0.26, 9);
}

// ════════════ 5. 솔루션 — 모은다 ════════════
pres.addSection({ title: "솔루션" });
{
  const s = contentSlide("솔루션", "03  솔루션 — 모은다",
    "Port-to-FC 5구간을 하나의 리드타임으로 잇습니다",
    "5구간에 데이터 소스와 리스크 민감도를 붙여 '몇 시간 뒤 판매가능 재고가 되는가'를 계산합니다. 배지는 연동 시의 갱신 방식이며, 현재 연결 상태는 09장에 따로 표기했습니다.",
    "엔진의 뼈대. 구간별 기준시간(base)에 리스크(항만혼잡·통관·기상·Dock)가 민감도만큼 곱해진다. 평소 43.3h → 위기 61.8h. 증가분은 모두 '평소(NORMAL) 대비': 통관 +7.9h, 항만 +6.2h, FC 입고 +1.5h. 배수는 '무리스크 기준시간 대비': 통관 ×2.0, 항만 ×2.1, FC 입고 ×1.5. 구간 기준시간은 가정값이며 자사 BL 이력으로 보정 예정.");
  const segs = [
    ["항만 대기·하역", "8h", "Port-MIS · AIS", "실시간", HEX.accent4],
    ["통관·검역", "12h", "UNI-PASS · 식약처", "실시간", HEX.accent4],
    ["컨테이너 반출", "4h", "UNI-PASS 반출", "준실시간", HEX.accent3],
    ["냉장 내륙운송", "6h", "운송사 TMS", "추정", HEX.dk2],
    ["FC 입고 대기", "5h", "자사 WMS Dock", "실시간", HEX.accent4],
  ];
  const sw = 1.64, gap = 0.15;
  segs.forEach(([t, h, src, st, col], i) => {
    const x = MX + i * (sw + gap);
    card(s, x, DY, sw, 1.62);
    circleNum(s, x + 0.15, DY + 0.15, String(i + 1), HEX.accent1, 0.34);
    txt(s, h, { x: x + 0.55, y: DY + 0.12, w: sw - 0.65, h: 0.4, fontSize: 18, bold: true, color: HEX.dk1, align: "right", valign: "middle" });
    txt(s, t, { x: x + 0.15, y: DY + 0.6, w: sw - 0.3, h: 0.3, fontSize: 11, bold: true, color: HEX.dk1 });
    txt(s, src, { x: x + 0.15, y: DY + 0.9, w: sw - 0.3, h: 0.25, fontSize: 8.5, color: HEX.dk2 });
    pill(s, x + 0.15, DY + 1.22, 0.8, st, col, 0.24, 8.5);
    if (i < 4) arrow(s, x + sw - 0.02, DY + 0.72, 0.19, HEX.accent5);
  });
  const by = DY + 1.82;
  card(s, MX, by, 4.3, 1.22);
  txt(s, "평소 (NORMAL)", { x: MX + 0.2, y: by + 0.12, w: 2, h: 0.25, fontSize: 10, bold: true, color: HEX.dk2 });
  stat(s, MX + 0.2, by + 0.3, 2, "43.3h", "1.80일 · 콜드체인 정상", HEX.accent4, 26);
  txt(s, "위기 (CRISIS)", { x: MX + 2.3, y: by + 0.12, w: 2, h: 0.25, fontSize: 10, bold: true, color: HEX.dk2 });
  stat(s, MX + 2.3, by + 0.3, 2, "61.8h", "2.58일 · +18.5h 지연", HEX.accent2, 26);
  card(s, MX + 4.45, by, W - MX - (MX + 4.45), 1.22, { fill: HEX.dk1, line: HEX.dk1 });
  txt(s, "어디서 새는가 — 평소 대비 증가 · 기준시간 대비 배수", { x: MX + 4.65, y: by + 0.08, w: 4, h: 0.24, fontSize: 10, bold: true, color: "B0B8C1" });
  [["통관·검역", "+7.9h", "기준 ×2.0"], ["항만 대기·하역", "+6.2h", "기준 ×2.1"], ["FC 입고 대기", "+1.5h", "기준 ×1.5"]].forEach(([t, v, r], i) => {
    const y = by + 0.35 + i * 0.21;
    txt(s, t, { x: MX + 4.65, y, w: 1.6, h: 0.2, fontSize: 9.5, color: HEX.lt1 });
    txt(s, v, { x: MX + 6.3, y, w: 0.8, h: 0.2, fontSize: 10, bold: true, color: HEX.accent2 });
    txt(s, r, { x: MX + 7.15, y, w: 1.6, h: 0.2, fontSize: 9.5, color: HEX.accent3 });
  });
  txt(s, "위기 시나리오: 항만혼잡 .7 · 통관 .6 · 기상 .4 · Dock .5", { x: MX + 4.65, y: by + 1.0, w: 4.2, h: 0.18, fontSize: 8, color: "8B95A1" });
}

// ════════════ 6. 조기경보 ════════════
{
  const s = contentSlide("솔루션", "04  솔루션 — 알아챈다",
    "임계 도달 평균 7.4시간 전에 경보를 올립니다",
    "합성 시계열 실험입니다. 리스크가 점진적으로 악화되는 200회 시뮬레이션에서, 최근 12관측 대비 이탈(z-score)과 추세 외삽으로 임계(재고 커버리지 2.5일인 가상 관찰 FC)에 닿기 전에 경보했습니다.",
    "조기경보 재현 실험(test_earlywarn.mjs, 시드 고정). 조건: z>1.8 + 추세 상승 + 5틱(2.5h) 뒤 예측치가 임계의 90% 초과. 점진 악화 200회: 임계 도달 전 경보 200/200, 실제 선행시간(임계 도달시각−경보시각) 평균 7.4h, 최소 1.0h, 최대 10.5h. 정상 지속 200회: 오경보 0회. 한계: 임계의 약 91%까지 일시 급등했다 회복하는 시나리오에서는 200/200 경보(근접 경보) — 급등·회복 구분은 보완 과제. 합성 데이터이며 실제 운영 성능이 아니다. 화면에 표시되는 선행시간은 당시 상승률 외삽값(평균 3.6h)으로 더 보수적이다.");
  [["100%", "임계 도달 전 경보", "점진 악화 200회 전건 (시드 고정)", HEX.accent4], ["7.4h", "평균 선행 시간", "실제 도달시각 기준 · 최소 1.0h ~ 최대 10.5h", HEX.accent1], ["0/200", "정상 상황 오경보", "한계: 임계 근처 일시 급등에는 경보", HEX.accent3]].forEach(([v, l, d, col], i) => {
    const y = DY + i * 1.02;
    card(s, MX, y, 3.6, 0.92);
    bar(s, MX, y, 0.08, 0.92, col);
    txt(s, v, { x: MX + 0.25, y: y + 0.1, w: 1.5, h: 0.72, fontSize: 28, bold: true, color: col, valign: "middle" });
    txt(s, l, { x: MX + 1.75, y: y + 0.16, w: 1.8, h: 0.3, fontSize: 12, bold: true, color: HEX.dk1 });
    txt(s, d, { x: MX + 1.75, y: y + 0.46, w: 1.8, h: 0.4, fontSize: 9.5, color: HEX.dk2 });
  });
  const rx = MX + 3.8, rw = W - MX - rx;
  card(s, rx, DY, rw, DH);
  txt(s, "어떻게 알아채는가", { x: rx + 0.2, y: DY + 0.12, w: rw - 0.4, h: 0.3, fontSize: 12.5, bold: true, color: HEX.dk1 });
  const bx = rx + 0.25, bw = 0.16, bgap = 0.07, base = DY + 1.55;
  [0.2, 0.22, 0.19, 0.23, 0.21, 0.24, 0.22, 0.28, 0.33, 0.4, 0.48, 0.57, 0.66].forEach((v, i) => {
    const h = v * 1.4; const col = i >= 8 ? (i >= 10 ? HEX.accent2 : HEX.accent3) : HEX.accent5;
    bar(s, bx + i * (bw + bgap), base - h, bw, h, col);
  });
  s.addShape(pres.shapes.LINE, { x: bx, y: base - 0.6 * 1.4, w: 13 * (bw + bgap), h: 0, line: { color: HEX.accent2, width: 1, dashType: "dash" }, objectName: nm("thr") });
  txt(s, "임계", { x: bx + 13 * (bw + bgap) + 0.05, y: base - 0.6 * 1.4 - 0.12, w: 0.6, h: 0.24, fontSize: 8.5, color: HEX.accent2 });
  txt(s, "baseline(최근 12관측)", { x: bx, y: base + 0.02, w: 2.2, h: 0.22, fontSize: 8.5, color: HEX.dk2 });
  pill(s, bx + 1.68, base - 1.42, 1.4, "⚠ 경보 · 평균 7.4h 전", HEX.accent2, 0.26, 8.5);
  ["z-score > 1.8 — 평소 패턴에서 유의하게 벗어났는가", "추세 상승 — 일시적 튐이 아니라 계속 나빠지는가", "5틱 외삽 > 임계 90% — 2.5시간 뒤 예측치가 임계의 90%를 넘는가"].forEach((c, i) => {
    const y = DY + 1.9 + i * 0.36;
    circleNum(s, rx + 0.2, y + 0.03, String(i + 1), HEX.accent1, 0.26);
    txt(s, c, { x: rx + 0.55, y, w: rw - 0.75, h: 0.32, fontSize: 10, color: HEX.dk1, valign: "middle" });
  });
}

// ════════════ 7. 선제배치 ════════════
{
  const s = contentSlide("솔루션", "05  솔루션 — 먼저 움직인다",
    "신규 선적이 오기 전 공백까지, 이관으로 메웁니다",
    "신규 선적은 61.8시간 뒤 도착하는데 용인은 14시간, 인천은 33.6시간 뒤 재고가 바닥납니다. 그래서 과재고 FC의 재고를 먼저 이관하고(브리지), 도착 물량은 위험 FC에 우선 배정합니다.",
    "선제 조치의 두 단계. ①브리지 이관: 신규 선적 도착(61.8h) 전에 소진되는 용인(14.0h)·인천(33.6h)에 김포·안성의 잉여 2,663개를 먼저 보낸다(이관 6시간 가정, 용인은 수용량 2,500 때문에 2회 분할). ②신규 선적 4,000개 배정: 인천 +1,559, 용인 +2,441. 정적 재고 커버리지 기준 High 2→0이며 배정 후 인천·용인 등급은 Low가 아니라 Medium. 시간축 검증(test_bridge.mjs): 브리지 없으면 도착 전 품절 3,567개, 안전재고 1.5일을 유지한 브리지로 904개, 안전재고를 약 1.0일로 낮추면 0개. 어느 쪽을 택할지는 담당자가 결정한다. 실행 버튼은 현재 모의 실행(WMS/TMS 미연동). 브리지 계획은 대시보드 ⑤ 선제 조치에 통합돼 있다: FC별 타임라인(현재 재고로 버팀 → 브리지로 메움 → 공백), '안전재고 유지/전량 메움' 선택, ⑥ 비용 임팩트의 시간축 검증 값. 시연 시 칠레산 체리 BL 선택 후 ⑤에서 보여준다.");
  const fcs = [["인천 FC", "재고 1,400 · 일수요 1,000", "33.6시간 뒤 소진", "High", HEX.accent2], ["김포 FC", "재고 5,200 · 일수요 1,000", "목표 초과 잉여 1,124", "과재고", HEX.accent3], ["용인 FC", "재고 700 · 일수요 1,200", "14.0시간 뒤 소진", "High", HEX.accent2], ["안성 FC", "재고 4,800 · 일수요 800", "목표 초과 잉여 1,539", "과재고", HEX.accent3]];
  const after = [["인천 FC", "신규 배정 +1,559", "브리지 입고 +272", "Medium", HEX.accent3, true], ["김포 FC", "브리지 출고 −1,124", "안전재고 1.5일 유지", "Low", HEX.accent4, false], ["용인 FC", "신규 배정 +2,441", "브리지 입고 +2,391 (2회 분할)", "Medium", HEX.accent3, true], ["안성 FC", "브리지 출고 −1,539", "안전재고 1.5일 유지", "Low", HEX.accent4, false]];
  const colw = 3.55;
  const colHdr = (x, label, sub, col) => {
    bar(s, x, DY, colw, 0.4, col);
    txt(s, label, { x: x + 0.15, y: DY, w: 1.6, h: 0.4, fontSize: 12, bold: true, color: HEX.lt1, valign: "middle" });
    txt(s, sub, { x: x + 1.5, y: DY, w: colw - 1.65, h: 0.4, fontSize: 9.5, color: HEX.lt1, align: "right", valign: "middle" });
  };
  colHdr(MX, "지금", "결품 High 2개 (인천·용인)", HEX.dk2);
  colHdr(MX + colw + 0.9, "조치 후", "결품 High 0개 (정적 커버리지)", HEX.accent1);
  fcs.forEach(([name, l1, l2, st, col], i) => {
    const y = DY + 0.48 + i * 0.5;
    card(s, MX, y, colw, 0.44);
    txt(s, name, { x: MX + 0.15, y, w: 0.85, h: 0.44, fontSize: 10.5, bold: true, color: HEX.dk1, valign: "middle" });
    txt(s, [{ text: l1, options: { color: HEX.dk2, breakLine: true } }, { text: l2, options: { color: st === "High" ? HEX.accent2 : HEX.dk2, bold: st === "High" } }], { x: MX + 1.0, y, w: 1.65, h: 0.44, fontSize: 8, valign: "middle" });
    pill(s, MX + colw - 0.85, y + 0.1, 0.7, st, col, 0.24, 8.5);
  });
  const ax = MX + colw + 0.05;
  txt(s, "① 브리지\n2,663개\n지금 출발", { x: ax, y: DY + 0.44, w: 0.8, h: 0.6, fontSize: 7.5, bold: true, color: HEX.accent6, align: "center", valign: "bottom" });
  arrow(s, ax + 0.12, DY + 1.08, 0.55, HEX.accent6);
  txt(s, "② 신규 선적\n4,000개\n61.8h 뒤", { x: ax, y: DY + 1.36, w: 0.8, h: 0.6, fontSize: 7.5, bold: true, color: HEX.accent1, align: "center", valign: "bottom" });
  arrow(s, ax + 0.12, DY + 2.0, 0.55, HEX.accent1);
  const ax2 = MX + colw + 0.9;
  after.forEach(([name, l1, l2, st, col, isRecv], i) => {
    const y = DY + 0.48 + i * 0.5;
    card(s, ax2, y, colw, 0.44);
    txt(s, name, { x: ax2 + 0.15, y, w: 0.85, h: 0.44, fontSize: 10.5, bold: true, color: HEX.dk1, valign: "middle" });
    txt(s, [{ text: l1, options: { color: isRecv ? HEX.accent1 : HEX.accent6, bold: true, breakLine: true } }, { text: l2, options: { color: isRecv ? HEX.accent6 : HEX.dk2, bold: isRecv } }], { x: ax2 + 1.0, y, w: 1.65, h: 0.44, fontSize: 8, valign: "middle" });
    pill(s, ax2 + colw - 0.85, y + 0.1, 0.7, st, col, 0.24, 8.5);
  });
  const cy = DY + 2.58;
  card(s, MX, cy, W - 2 * MX, 0.52, { fill: HEX.dk1, line: HEX.dk1 });
  txt(s, [{ text: "시간축 검증  ", options: { bold: true, color: HEX.accent3 } }, { text: "도착 전 품절 3,567개 → 브리지로 904개. 안전재고를 1.5일 → 1.0일로 낮추면 0개. 이 선택은 담당자가 합니다.", options: { color: HEX.lt1 } }], { x: MX + 0.2, y: cy, w: 7.0, h: 0.52, fontSize: 9, valign: "middle" });
  pill(s, W - MX - 1.4, cy + 0.12, 1.25, "모의 실행  ›", HEX.accent1, 0.28, 10);
}

// ════════════ 8. 비용 임팩트 ════════════
{
  const s = contentSlide("솔루션", "06  비용 임팩트 — 가정 기반 비용모델",
    "위기 시나리오의 예상손실을 79~90% 줄입니다",
    "실측이 아닌 가정 기반 비용모델입니다. 정적 모델은 90%, 신규 선적 도착 전 공백을 시간축으로 검증하면 79%(안전재고 유지)~88%(안전재고 일부 사용)이며, 실제 절감률은 파일럿에서 확인합니다.",
    "위기·칠레산 체리(단가 12,000원) 기준 비용모델. 적용 전(선제조치 없음): 결품 3,567개×마진 30% + 목표재고 초과 잉여 2,663개×폐기율 50% = 2,882만원. 정적 모델(대시보드 표시값): 결품·폐기 0 가정, 운송비 286만원 → 90% 감소. 시간축 검증(test_bridge.mjs): 안전재고 1.5일 유지 시 도착 전 잔여 결품 904개가 남아 612만원(78.8% 감소), 안전재고를 약 1.0일로 낮춰 전량 이관하면 350만원(87.9% 감소). 한계: 폐기는 유통기한 실측이 아니라 '목표재고 초과분×가정 폐기율'. 비교 대상은 '미조치'이며 기존 수기 운영 대비 우월함을 증명한 것은 아님. 실제 절감률은 파일럿에서 동일 물량·수요 조건으로 측정.");
  const CAT = ["적용 전", "정적 모델", "시간축·안전", "시간축·전량"];
  s.addChart(pres.charts.BAR, [
    { name: "결품 예상손실", labels: CAT, values: [1284, 0, 325, 0] },
    { name: "재고폐기 예상손실", labels: CAT, values: [1598, 0, 0, 0] },
    { name: "운송비 투입", labels: CAT, values: [0, 286, 286, 350] },
  ], {
    x: MX, y: DY, w: 5.3, h: DH, barDir: "col", barGrouping: "stacked", barGapWidthPct: 60,
    chartColors: [HEX.accent2, HEX.accent3, HEX.accent1],
    showTitle: true, title: "시나리오별 예상손실 (만원)", titleFontSize: 11, titleColor: HEX.dk1, titleFontFace: "+mn-lt",
    showValue: true, dataLabelPosition: "ctr", dataLabelColor: HEX.lt1, dataLabelFontSize: 9, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: "#,##0;;",
    showLegend: true, legendPos: "b", legendFontSize: 9, legendColor: HEX.dk2, legendFontFace: "+mn-lt",
    catAxisLabelColor: HEX.dk1, catAxisLabelFontSize: 10, catAxisLabelFontFace: "+mn-lt", catGridLine: { style: "none" },
    valAxisLabelColor: HEX.dk2, valAxisLabelFontSize: 9, valAxisLabelFontFace: "+mn-lt", valGridLine: { color: HEX.accent5, size: 0.5 }, valAxisMaxVal: 3200, valAxisMajorUnit: 800,
    plotArea: { fill: { color: HEX.lt1 } }, chartArea: { fill: { color: HEX.lt1 }, roundedCorners: true },
    objectName: "costChart",
  });
  const rx = MX + 5.5, rw = W - MX - rx;
  [["₩2,882만", "적용 전 예상손실 (선제조치 없음)", "결품 3,567개 + 폐기 위험 잉여 2,663개", HEX.accent2], ["₩286만 ~ 612만", "FreshFlow 적용 후", "운송비 + 도착 전 잔여 결품(시간축 검증)", HEX.accent1], ["79 ~ 90%", "예상손실 감소율", "정적 모델 90% · 시간축 검증 79~88%", HEX.accent4]].forEach(([v, l, d, col], i) => {
    const y = DY + i * 1.02;
    card(s, rx, y, rw, 0.92);
    txt(s, l, { x: rx + 0.2, y: y + 0.1, w: rw - 0.4, h: 0.24, fontSize: 9.5, bold: true, color: HEX.dk2 });
    txt(s, v, { x: rx + 0.2, y: y + 0.3, w: rw - 0.4, h: 0.4, fontSize: 20, bold: true, color: col, valign: "middle" });
    txt(s, d, { x: rx + 0.2, y: y + 0.68, w: rw - 0.4, h: 0.22, fontSize: 8.5, color: HEX.dk2 });
  });
  txt(s, "가정: 칠레산 체리 단가 12,000원 · 결품 마진손실 30% · 목표재고 초과분 폐기율 50% · 배치 250원/개 · 이관 700원/개 · FC 간 이관 6시간", { x: MX, y: H - 0.62, w: 8.6, h: 0.22, fontSize: 8, color: HEX.dk2, italic: true });
}

// ════════════ 9. 활용 기술 (신규) ════════════
pres.addSection({ title: "기술과 적용" });
{
  const s = contentSlide("기술과 적용", "07  활용 기술",
    "계산은 검증된 엔진이, 읽고 설명하는 일은 LLM이 합니다",
    "AI에게 숫자 계산을 맡기지 않습니다. 리드타임·결품·배치는 테스트로 검증한 규칙 엔진이 계산하고, LLM은 비정형 텍스트를 리스크 입력으로 바꾸고 결과를 브리핑하는 데만 씁니다.",
    "기술 구성 5층. ①공공 API 어댑터(기상청·UNI-PASS, Node 서버리스) ②규칙기반 엔진(JS 순수 함수, test_*.mjs 검증) ③통계 이상감지(z-score) ④Claude API(리스크 센싱·Copilot, 폴백 상시) ⑤React 대시보드(Vercel 배포). 역할을 나눈 이유: 재현성·설명가능성·무중단.");
  const layers = [
    ["데이터 수집", "공공 API 어댑터", "기상청 실황·특보, UNI-PASS 통관 이력을 0~1 리스크로 정규화", HEX.dk2],
    ["예측·판단 엔진", "규칙기반 계산", "리드타임 5구간 · 결품 판정 · 2단계 선제배치 · 비용 환산", HEX.accent1],
    ["이상 감지", "통계 (z-score)", "평소 패턴 대비 이탈과 추세 외삽으로 결품 전에 경보", HEX.accent3],
    ["생성형 AI", "Claude API (LLM)", "비정형 텍스트를 리스크 수치와 근거로 추출, 결과를 브리핑", HEX.accent6],
    ["화면·실행", "React · 서버리스", "한 화면 대시보드와 1-click 실행, Vercel 배포로 상시 접속", HEX.accent4],
  ];
  const lw = 5.95, lh = 0.54, lg = 0.1;
  layers.forEach(([name, tech, role, col], i) => {
    const y = DY + i * (lh + lg);
    card(s, MX, y, lw, lh);
    circleNum(s, MX + 0.14, y + 0.12, String(i + 1), col, 0.3);
    txt(s, name, { x: MX + 0.56, y, w: 1.35, h: lh, fontSize: 11, bold: true, color: HEX.dk1, valign: "middle" });
    pill(s, MX + 1.95, y + 0.14, 1.42, tech, col, 0.26, 8);
    txt(s, role, { x: MX + 3.5, y, w: lw - 3.65, h: lh, fontSize: 8.5, color: HEX.dk2, valign: "middle" });
  });
  const rx = MX + lw + 0.15, rw = W - MX - rx;
  card(s, rx, DY, rw, DH, { fill: HEX.dk1, line: HEX.dk1 });
  txt(s, "왜 이렇게 나눴나", { x: rx + 0.18, y: DY + 0.12, w: rw - 0.36, h: 0.26, fontSize: 9.5, bold: true, color: "B0B8C1", charSpacing: 1 });
  [["재현성", "같은 입력이면 같은 숫자. 계산은 LLM이 아니라 테스트로 검증한 엔진이 합니다."],
   ["설명가능성", "AI가 뽑은 리스크마다 근거 문장을 붙여 사람이 검토할 수 있습니다."],
   ["무중단", "API가 없거나 실패해도 규칙기반 폴백으로 계속 동작합니다."]].forEach(([t, d], i) => {
    const y = DY + 0.48 + i * 0.86;
    txt(s, t, { x: rx + 0.18, y, w: rw - 0.36, h: 0.26, fontSize: 12, bold: true, color: HEX.lt1 });
    txt(s, d, { x: rx + 0.18, y: y + 0.27, w: rw - 0.36, h: 0.55, fontSize: 8.5, color: "B0B8C1", valign: "top" });
  });
}

// ════════════ 10. AI ════════════
{
  const s = contentSlide("기술과 적용", "08  AI — 설명자가 아니라 구동자",
    "LLM이 설명만 하지 않고, 엔진을 직접 구동합니다",
    "뉴스·UNI-PASS 공지·기상특보 같은 비정형 텍스트를 Claude가 읽어 리스크 4종을 수치와 근거로 뽑아내고, 그 값이 슬라이더를 움직여 리드타임·결품·비용을 다시 계산합니다.",
    "AI 리스크 센싱(실제 LLM 호출 1회 예시): 위기문 입력 → cong .82 · cust .75 · wx .70 · dock .85 + 항목별 근거. LLM이 함께 제안한 통관 소요시간 범위 18~36시간은 미보정 추정이며, 실제 분위수(P50/P90)로 검증된 값이 아니다. 키 없거나 실패 시 규칙기반 폴백. 보완 계획: 고정 평가문장 30~50개(부정문·타 항만·오래된 기사·근거 없는 Dock 혼잡 포함)로 키워드 규칙 대비 근거 인용 정확성과 반복 호출 편차를 평가.");
  const steps = [["비정형 텍스트", "뉴스 · UNI-PASS 공지 · 기상특보 · 항만 파업", HEX.dk2], ["Claude 리스크 센싱", "항만혼잡·통관·기상·Dock 4종을 0~1 수치 + 항목별 근거로 추출", HEX.accent1], ["엔진 재계산", "슬라이더 자동 조정 → 리드타임·결품·비용 즉시 갱신", HEX.accent6], ["AI Copilot 브리핑", "진단 | 조치 | 실행 — 3섹션 자연어 (규칙기반 폴백 상시)", HEX.accent4]];
  const sw = 2.0, gap = 0.27;
  steps.forEach(([t, d, col], i) => {
    const x = MX + i * (sw + gap);
    card(s, x, DY, sw, 1.42);
    circleNum(s, x + 0.15, DY + 0.15, String(i + 1), col, 0.34);
    txt(s, t, { x: x + 0.15, y: DY + 0.56, w: sw - 0.3, h: 0.3, fontSize: 11.5, bold: true, color: HEX.dk1 });
    txt(s, d, { x: x + 0.15, y: DY + 0.86, w: sw - 0.3, h: 0.54, fontSize: 9, color: HEX.dk2, valign: "top" });
    if (i < 3) arrow(s, x + sw + 0.04, DY + 0.6, 0.19, HEX.accent1);
  });
  const by = DY + 1.6;
  card(s, MX, by, 5.5, 1.44);
  txt(s, "실제 LLM 호출 결과 (1회 예시) — 위기 문장 입력 시", { x: MX + 0.2, y: by + 0.1, w: 5, h: 0.26, fontSize: 10.5, bold: true, color: HEX.dk1 });
  [["항만 혼잡", ".82", "\"인천항 선석 대기 48시간\""], ["통관·검역", ".75", "\"검역 정밀검사 비율 확대\""], ["기상", ".70", "\"태풍 북상 · 강풍 특보\""], ["FC Dock", ".85", "\"입고 슬롯 포화\""]].forEach(([t, v, ev], i) => {
    const y = by + 0.4 + i * 0.25;
    txt(s, t, { x: MX + 0.2, y, w: 1, h: 0.24, fontSize: 9.5, color: HEX.dk1 });
    bar(s, MX + 1.2, y + 0.06, 1.6, 0.12, HEX.accent5);
    bar(s, MX + 1.2, y + 0.06, 1.6 * parseFloat(v), 0.12, HEX.accent2);
    txt(s, v, { x: MX + 2.85, y, w: 0.4, h: 0.24, fontSize: 9.5, bold: true, color: HEX.accent2 });
    txt(s, ev, { x: MX + 3.25, y, w: 2.1, h: 0.24, fontSize: 8.5, color: HEX.dk2, italic: true });
  });
  const ex = MX + 5.7, ew = W - MX - ex;
  card(s, ex, by, ew, 1.44, { fill: HEX.dk1, line: HEX.dk1 });
  txt(s, "통관 소요시간 참고 범위 (LLM 제안)", { x: ex + 0.2, y: by + 0.1, w: ew - 0.4, h: 0.26, fontSize: 10.5, bold: true, color: "B0B8C1" });
  txt(s, "18 ~ 36시간", { x: ex + 0.2, y: by + 0.4, w: 1.9, h: 0.4, fontSize: 18, bold: true, color: HEX.lt1 });
  pill(s, ex + ew - 0.95, by + 0.48, 0.75, "미보정", HEX.accent3, 0.24, 8.5);
  txt(s, "실제 분위수(P50/P90)로 검증된 값이 아닙니다. 근거 문장과 출처 배지(AI/폴백)를 함께 표시해 사람이 검토합니다.", { x: ex + 0.2, y: by + 0.86, w: ew - 0.4, h: 0.5, fontSize: 8.5, color: "B0B8C1" });
}

// ════════════ 11. 실데이터 연동 ════════════
{
  const s = contentSlide("기술과 적용", "09  실데이터 연동",
    "기상·통관 API 어댑터를 구현하고 검증했습니다",
    "엔진은 그대로, 데이터 소스만 어댑터로 교체합니다. 현재 단계는 '구현과 응답 검증'이며, 인증키를 넣은 실호출은 발급 후 확인할 과제입니다. 소스별 상태는 화면에 배지로 그대로 표기합니다.",
    "lib/live.js 어댑터: 소스별 독립 실행, status live|nokey|error|notfound|unavailable. 상태 4단계(어댑터 구현 → 응답 검증 → 인증키 실호출 → 운영 이력) 중 기상청은 명세 기반 샘플 검증, UNI-PASS는 실제 응답 8건 검증까지 완료. 인증키 실호출은 아직 하지 않았다(배포 서버도 '키 미설정' 상태). Port-MIS·식약처 검사 정보·WMS·TMS는 미연동이며 FC 재고는 현재 샘플 데이터. 수입 검역 정보는 KATI(수출 방향)가 아니라 식약처 수입식품정보마루와 UNI-PASS 검사검역을 쓴다.");
  const rows = [
    ["기상 리스크 (wx)", "기상청 초단기실황 + 기상특보 (인천 격자)", "샘플 검증", HEX.accent1],
    ["통관·검역 (cust)", "관세청 UNI-PASS 화물통관진행정보 (BL 조회)", "실응답 검증", HEX.accent4],
    ["항만 혼잡 (cong)", "해수부 Port-MIS 입항·관제 + AIS", "미연동", HEX.dk2],
    ["검사·검역 이력", "식약처 수입식품정보마루 · UNI-PASS 검사검역", "미연동", HEX.dk2],
    ["FC 재고·Dock", "자사 WMS (현재 샘플 재고)", "미연동", HEX.dk2],
    ["내륙 운송", "운송사 TMS / GPS", "미연동", HEX.dk2],
  ];
  const tw = 5.9;
  bar(s, MX, DY, tw, 0.34, HEX.dk1);
  txt(s, "리스크 입력", { x: MX + 0.15, y: DY, w: 1.6, h: 0.34, fontSize: 9.5, bold: true, color: HEX.lt1, valign: "middle" });
  txt(s, "데이터 소스", { x: MX + 1.75, y: DY, w: 3, h: 0.34, fontSize: 9.5, bold: true, color: HEX.lt1, valign: "middle" });
  txt(s, "상태", { x: MX + tw - 1.1, y: DY, w: 0.95, h: 0.34, fontSize: 9.5, bold: true, color: HEX.lt1, align: "center", valign: "middle" });
  rows.forEach(([k, src, st, col], i) => {
    const y = DY + 0.4 + i * 0.44;
    card(s, MX, y, tw, 0.4);
    txt(s, k, { x: MX + 0.15, y, w: 1.6, h: 0.4, fontSize: 10, bold: true, color: HEX.dk1, valign: "middle" });
    txt(s, src, { x: MX + 1.75, y, w: 3.05, h: 0.4, fontSize: 9, color: HEX.dk2, valign: "middle" });
    pill(s, MX + tw - 1.1, y + 0.08, 0.95, st, col, 0.24, 8.5);
  });
  const rx = MX + tw + 0.25, rw = W - MX - rx;
  card(s, rx, DY, rw, 1.65);
  txt(s, "어댑터 구조", { x: rx + 0.15, y: DY + 0.1, w: rw - 0.3, h: 0.26, fontSize: 11, bold: true, color: HEX.dk1 });
  ["공공 API", "정규화 0~1", "엔진 리스크"].forEach((f, i) => {
    const x = rx + 0.15 + i * 0.84;
    pill(s, x, DY + 0.45, 0.72, f, i === 2 ? HEX.accent1 : HEX.dk2, 0.3, 7.5);
    if (i < 2) arrow(s, x + 0.73, DY + 0.49, 0.1, HEX.accent5);
  });
  txt(s, "· 단계: 구현 → 응답 검증 → 실호출 → 운영\n· 현재: 기상 샘플 검증, 통관 실응답 검증\n· 인증키 실호출은 발급 후 확인 예정\n· 키 없음 → '키 미설정' 배지로 그대로 노출", { x: rx + 0.15, y: DY + 0.85, w: rw - 0.3, h: 0.75, fontSize: 8, color: HEX.dk2, valign: "top" });
  card(s, rx, DY + 1.78, rw, 1.3, { fill: HEX.dk1, line: HEX.dk1 });
  txt(s, "기상→wx 정규화 (테스트 20건)", { x: rx + 0.15, y: DY + 1.86, w: rw - 0.3, h: 0.24, fontSize: 9.5, bold: true, color: "B0B8C1" });
  [["평온", ".05", HEX.accent4], ["폭우+강풍", ".75", HEX.accent3], ["+태풍 특보", "1.0", HEX.accent2], ["폭염+특보", ".45", HEX.accent3]].forEach(([t, v, col], i) => {
    const y = DY + 2.14 + i * 0.22;
    txt(s, t, { x: rx + 0.15, y, w: 1.1, h: 0.2, fontSize: 8.5, color: HEX.lt1 });
    bar(s, rx + 1.3, y + 0.05, 0.85 * parseFloat(v), 0.1, col);
    txt(s, v, { x: rx + 2.2, y, w: 0.4, h: 0.2, fontSize: 8.5, bold: true, color: HEX.lt1, align: "right" });
  });
}

// ════════════ 12. 실제 적용 가능성 (신규) ════════════
{
  const s = contentSlide("기술과 적용", "10  실제 적용 가능성",
    "실제 통관 응답 8건으로 파서를 검증하고 고쳤습니다",
    "이 8건은 파싱과 구간시간 산출이 가능함을 보인 표본입니다. 냉장 식품의 ETA 정확도나 결품 방지 효과의 증거는 아닙니다. 그 검증은 실제 식품 BL과 FC 이력으로 하는 파일럿의 몫입니다.",
    "근거: 오픈소스 node-unipass에 포함된 실제 UNI-PASS 응답 8건(해상 2·항공 6, 인천세관, 2017~2020, 특송화물). 입항→반출 2.8h~144.3h. 늦어진 해상 2건은 반출 전에 '하선장소 반입기간연장 승인신청'이 먼저 찍힘(빠른 건 5.8일 전). 이 검증으로 파서 오류를 찾아 수정, 어댑터 테스트 20건 통과. 한계: 냉장 식품 컨테이너의 검사·검역 경로는 실제 BL로 추가 확인 필요. ML은 자사 BL 이력 축적 후 규칙기반 대비 개선을 검증한 뒤에만 주장. 상세: FreshFlow_실데이터_타당성검토.md");
  const lw = 4.3;
  card(s, MX, DY, lw, DH);
  txt(s, "입항 → 반출 실측 (실제 응답 8건)", { x: MX + 0.2, y: DY + 0.1, w: lw - 0.4, h: 0.24, fontSize: 10.5, bold: true, color: HEX.dk1 });
  txt(s, "오픈소스 공개 응답 · 2017~2020년 · 특송화물 · 인천세관", { x: MX + 0.2, y: DY + 0.34, w: lw - 0.4, h: 0.2, fontSize: 8, color: HEX.dk2 });
  const samples = [["항공 US", 2.8, "2.8h"], ["항공 CN", 4.1, "4.1h"], ["항공 US", 6.0, "6.0h"], ["항공 US", 9.1, "9.1h"], ["항공 HK", 18.8, "18.8h"], ["항공 UK", 90.7, "90.7h (3.8일)"], ["해상 CN", 96.5, "96.5h (4.0일)"], ["해상 CN", 144.3, "144.3h (6.0일)"]];
  const bx = MX + 1.0, bmax = 2.1;
  samples.forEach(([label, v, vt], i) => {
    const y = DY + 0.6 + i * 0.25;
    const bw = Math.max(0.04, (v / 144.3) * bmax);
    txt(s, label, { x: MX + 0.2, y, w: 0.75, h: 0.22, fontSize: 8.5, color: HEX.dk2, valign: "middle" });
    bar(s, bx, y + 0.04, bw, 0.14, label.startsWith("해상") ? HEX.accent3 : HEX.accent1);
    txt(s, vt, { x: bx + bw + 0.06, y, w: 1.05, h: 0.22, fontSize: 8.5, bold: v >= 90, color: v >= 90 ? HEX.accent2 : HEX.dk1, valign: "middle" });
  });
  txt(s, "2.8시간 ~ 6.0일의 차이는 데이터 변동 사례입니다(식품 성능 아님).\n늦어진 해상 화물은 반출 전에 '반입기간연장 신청'이 먼저 찍혔습니다.", { x: MX + 0.2, y: DY + 2.64, w: lw - 0.4, h: 0.42, fontSize: 8, bold: true, color: HEX.accent6, valign: "top" });
  const rx = MX + lw + 0.15, rw = W - MX - rx, ch = 0.95, cg = 0.1;
  [["실제 응답이 찾아낸 오류, 그리고 수정", "실제 응답을 넣자 8건 모두 오분류했습니다. 원인은 둘이었습니다. 이력이 최신순으로 오고, 일상적인 '정정' 이벤트를 위험으로 오인했습니다. 수정 후 8건 정상, 회귀 테스트 20건.", HEX.accent4],
   ["도입에 필요한 것", "고객사 BL 목록, FC 재고(CSV부터 시작), 인증키. 공공 API는 무료입니다. 8주 파일럿으로 예측 오차와 추천 채택률, 순편익을 측정합니다.", HEX.accent1],
   ["남은 과제 (정직하게)", "인증키 실호출, 냉장 식품 컨테이너의 검사·검역 경로 확인. ML은 자사 이력이 쌓인 뒤 규칙기반 대비 개선을 검증하고 말합니다.", HEX.accent3]].forEach(([t, d, col], i) => {
    const y = DY + i * (ch + cg);
    card(s, rx, y, rw, ch);
    bar(s, rx, y, 0.08, ch, col);
    txt(s, t, { x: rx + 0.24, y: y + 0.08, w: rw - 0.4, h: 0.26, fontSize: 11, bold: true, color: HEX.dk1 });
    txt(s, d, { x: rx + 0.24, y: y + 0.35, w: rw - 0.4, h: 0.56, fontSize: 8.5, color: HEX.dk2, valign: "top" });
  });
}

// ════════════ 13. 기대효과 (신규) ════════════
pres.addSection({ title: "효과와 비전" });
{
  const s = contentSlide("효과와 비전", "11  기대효과",
    "결품·폐기는 줄이고, 담당자는 조회에서 판단으로",
    "효과는 담당자의 하루, 회사의 손익, 공공데이터 활용의 세 층에서 나옵니다. 수치는 위기 시나리오(칠레산 체리 4,000개) 기준 로직 검증값이며, 실측은 파일럿에서 확인합니다.",
    "기대효과 3층. 담당자: 결품 평균 7.4시간 전 경보, 조회·밸런싱 계산 자동화. 회사: 결품 High FC 2→0, 예상손실 2,882만→287만원(90%↓), 신선도 손실 위험 사전 확인. 산업: 분절된 공공데이터를 유통 SCM 의사결정에 연결, 이력 축적 시 리드타임 기준 확보. 모든 수치는 시뮬레이션·로직 검증값이며 실측 아님.");
  const cols = [
    ["담당자의 하루", "7.4시간 전", "임계 도달 전 평균 경보 (시뮬레이션)", ["여러 시스템 수기 조회와 엑셀 밸런싱을 시스템이 대신", "새벽 결품 연락 대신 근무시간 안에 조치", "FC가 늘어도 업무가 비례해 늘지 않음"], HEX.accent1],
    ["회사의 손익", "손실 79~90%↓", "비용모델 · 예상손실 2,882만 원 기준", ["결품 High FC 2개 → 0개 (정적 기준)", "도착 전 공백은 FC 간 이관으로 축소", "신선도 손실 위험을 사전에 수치로 확인"], HEX.accent2],
    ["공공데이터 활용", "데이터 → 결정", "분절된 정보를 의사결정으로", ["기상청·UNI-PASS를 유통 SCM 판단에 연결", "이력이 쌓이면 품목·항만별 리드타임 기준 확보", "데이터 축적 후 예측 고도화의 기반"], HEX.accent4],
  ];
  const cw = 2.84, gap = 0.14, ch = 2.45;
  cols.forEach(([who, big, cap, items, col], i) => {
    const x = MX + i * (cw + gap);
    card(s, x, DY, cw, ch);
    bar(s, x, DY, cw, 0.07, col);
    txt(s, who, { x: x + 0.2, y: DY + 0.17, w: cw - 0.4, h: 0.24, fontSize: 9.5, bold: true, color: HEX.dk2 });
    txt(s, big, { x: x + 0.2, y: DY + 0.42, w: cw - 0.4, h: 0.48, fontSize: 22, bold: true, color: col, valign: "middle" });
    txt(s, cap, { x: x + 0.2, y: DY + 0.9, w: cw - 0.4, h: 0.24, fontSize: 9, color: HEX.dk1, bold: true });
    bullets(s, items, { x: x + 0.2, y: DY + 1.22, w: cw - 0.4, h: ch - 1.3, fontSize: 9, color: HEX.dk2 });
  });
  const sy = DY + ch + 0.13, sh = DH - ch - 0.13;
  card(s, MX, sy, W - 2 * MX, sh, { fill: HEX.dk1, line: HEX.dk1 });
  pill(s, MX + 0.2, sy + (sh - 0.26) / 2, 0.75, "Before", HEX.dk2, 0.26, 8.5);
  txt(s, "흩어진 조회 · 사후 대응 · 수기 밸런싱", { x: MX + 1.05, y: sy, w: 2.9, h: sh, fontSize: 10, color: "B0B8C1", valign: "middle" });
  arrow(s, MX + 4.0, sy + (sh - 0.22) / 2, 0.4, HEX.accent1);
  pill(s, MX + 4.6, sy + (sh - 0.26) / 2, 0.75, "After", HEX.accent1, 0.26, 8.5);
  txt(s, "한 화면 통합 · 결품 전 경보 · 버튼으로 실행", { x: MX + 5.45, y: sy, w: 3.2, h: sh, fontSize: 10, bold: true, color: HEX.lt1, valign: "middle" });
}

// ════════════ 14. 사업 모델 (신규) ════════════
{
  const s = contentSlide("효과와 비전", "12  사업 모델",
    "중견 수입 유통사에, FC·물량 기준 구독으로 팝니다",
    "컨테이너 추적은 건당 2달러 요금 사례가 있을 만큼 범용화됐습니다. FreshFlow는 위치가 아니라 결품·폐기를 줄이는 의사결정을 팔기 때문에 FC 수와 물량으로 과금합니다. 가격은 검증 전 가설입니다.",
    "타깃: FC 3개 이상을 운영하는 중견 수입 신선식품 유통사의 SCM 조직이 첫 시장(고통 최대, 자체 구축 어려움, BL 단위 조회 구조와 맞음). 2차 식자재 유통 대기업, 3차 대형마트·이커머스, 관세법인·콜드체인 3PL은 채널. 과금: FC 수 × BL 물량 구독(Starter 월 99만, Growth 월 290만, Enterprise 연 1억~, 모두 제안가). ROI 가설: 비용모델 절감 2,270만(시간축·안전재고 유지)~2,596만 원(정적 모델)/건 → Growth 연 3,480만 원은 위기 1.3~1.5건분, 이산 사건으로는 약 2건. 사건 빈도·예방 가능 비율·도입비·운영비 미반영이라 확정 ROI가 아니다. '건당 2달러'는 ShipsGo 공개 요금 사례. 366억 달러는 식품 수입 거래 규모이며 소프트웨어 시장 규모가 아니다. 진입: 8주 성과 검증 파일럿 → 구독 → 벤치마크·실행 연동. 시장: 2025년 수입식품 87.4만 건·366억 달러(식약처). 가격·고객 수는 가정이며 인터뷰·파일럿으로 검증 예정. 상세: FreshFlow_사업성검토.md");
  const bh = 2.45;
  // 좌: 타깃 우선순위
  const lw = 2.8;
  card(s, MX, DY, lw, bh);
  txt(s, "타깃 — 누구에게 먼저", { x: MX + 0.2, y: DY + 0.1, w: lw - 0.4, h: 0.26, fontSize: 11, bold: true, color: HEX.dk1 });
  [["1", "중견 수입 신선식품 유통사", "첫 시장 · FC 3~10개 · 자체 구축 어려움", HEX.accent1],
   ["2", "식자재 유통 대기업", "FC 수십 개 · 레퍼런스 확보 후", HEX.dk2],
   ["3", "대형마트 · 이커머스", "물량 최대 · 연동형 엔터프라이즈", HEX.dk2]].forEach(([no, name, sub, col], i) => {
    const y = DY + 0.47 + i * 0.5;
    circleNum(s, MX + 0.2, y + 0.06, no, col, 0.28);
    txt(s, name, { x: MX + 0.58, y, w: lw - 0.73, h: 0.22, fontSize: 10, bold: true, color: i === 0 ? HEX.accent6 : HEX.dk1, valign: "middle" });
    txt(s, sub, { x: MX + 0.58, y: y + 0.21, w: lw - 0.73, h: 0.2, fontSize: 8, color: HEX.dk2, valign: "middle" });
  });
  bar(s, MX + 0.2, DY + 1.98, lw - 0.4, 0.01, HEX.accent5);
  txt(s, "구매 결정: SCM 팀장·임원 · 채널: 관세법인·3PL", { x: MX + 0.2, y: DY + 2.05, w: lw - 0.4, h: 0.26, fontSize: 8, bold: true, color: HEX.dk2, valign: "middle" });
  // 중: 구독 요금
  const mx = MX + lw + 0.15, mw = 3.8;
  card(s, mx, DY, mw, bh);
  txt(s, "과금 — FC 수 × BL 물량 구독", { x: mx + 0.2, y: DY + 0.1, w: 2.4, h: 0.26, fontSize: 11, bold: true, color: HEX.dk1 });
  pill(s, mx + mw - 0.85, DY + 0.11, 0.65, "제안가", HEX.accent3, 0.22, 8);
  [["Starter", "FC 3개 이하 · 200건/월\n리드타임 · 결품 진단", "월 99만 원", HEX.dk1],
   ["Growth", "FC 10개 이하 · 1,000건/월\nAI 센싱 · 선제배치 추천", "월 290만 원", HEX.accent1],
   ["Enterprise", "FC 10개 초과 · 무제한\nWMS·ERP 연동 · SLA", "연 1억 원~", HEX.dk1]].forEach(([plan, scope, price, col], i) => {
    const y = DY + 0.47 + i * 0.56;
    card(s, mx + 0.15, y, mw - 0.3, 0.5, { fill: i === 1 ? "E8F3FF" : HEX.lt2, line: i === 1 ? HEX.accent1 : HEX.lt2 });
    txt(s, plan, { x: mx + 0.28, y, w: 0.85, h: 0.5, fontSize: 10.5, bold: true, color: col, valign: "middle" });
    txt(s, scope, { x: mx + 1.12, y, w: 1.55, h: 0.5, fontSize: 7.5, color: HEX.dk2, valign: "middle" });
    txt(s, price, { x: mx + 2.67, y, w: mw - 2.92, h: 0.5, fontSize: 11, bold: true, color: col, align: "right", valign: "middle" });
  });
  txt(s, "초과 BL 건당 2,000~3,000원 · 연동 도입비 별도", { x: mx + 0.2, y: DY + 2.17, w: mw - 0.4, h: 0.22, fontSize: 8, color: HEX.dk2 });
  // 우: 고객 ROI
  const rx = mx + mw + 0.15, rw = W - MX - rx;
  card(s, rx, DY, rw, bh, { fill: HEX.dk1, line: HEX.dk1 });
  txt(s, "고객 ROI 가설", { x: rx + 0.18, y: DY + 0.12, w: rw - 0.36, h: 0.24, fontSize: 9.5, bold: true, color: "B0B8C1", charSpacing: 1 });
  txt(s, "약 2건", { x: rx + 0.18, y: DY + 0.4, w: rw - 0.36, h: 0.55, fontSize: 28, bold: true, color: HEX.accent4, valign: "middle" });
  txt(s, "지연 위기 약 2건분의 절감이 연 구독료에 해당합니다", { x: rx + 0.18, y: DY + 0.98, w: rw - 0.36, h: 0.5, fontSize: 9, bold: true, color: HEX.lt1, valign: "top" });
  txt(s, "절감 2,270~2,596만 원/건\n연 구독료 3,480만 원\n빈도·도입비 미반영", { x: rx + 0.18, y: DY + 1.62, w: rw - 0.36, h: 0.75, fontSize: 8, color: "B0B8C1", valign: "top" });
  // 하단: 진입 경로 + 시장 근거
  const sy = DY + bh + 0.13, sh = DH - bh - 0.13;
  card(s, MX, sy, W - 2 * MX, sh, { fill: "E8F3FF", line: "E8F3FF" });
  txt(s, "진입 경로: 8주 성과 검증 파일럿 → 구독 전환 → 리드타임 벤치마크·실행 연동", { x: MX + 0.2, y: sy, w: 5.0, h: sh, fontSize: 10, bold: true, color: HEX.accent6, valign: "middle" });
  txt(s, "참고: 2025년 수입식품 87.4만 건·366억 달러 (거래 규모)", { x: MX + 5.2, y: sy, w: W - 2 * MX - 5.4, h: sh, fontSize: 8, color: HEX.dk2, align: "right", valign: "middle" });
}

// ════════════ 15. 설계 원칙 — 정직성 ════════════
{
  const s = contentSlide("효과와 비전", "13  설계 원칙 — 정직성",
    "\"다 된다\"고 말하지 않습니다",
    "현재 엔진은 규칙기반 계산 + 실제 LLM 센싱입니다. 데이터 없이 ML 정확도를 주장하지 않고, 되는 것과 안 되는 것(데이터 가용성·추정 여부)을 배지로 화면에 그대로 씁니다.",
    "정직성 3원칙 + 경쟁 차별점. ML은 데이터 축적 후 고도화(Phase 3). 모든 외부 의존(API)은 폴백. 모든 로직은 test_*.mjs로 수치 검증.");
  const cards = [
    ["✓", "데이터 가용성 배지", "구간별 실시간/준실시간/추정, 소스별 검증 단계/키 미설정/미연동을 화면에 그대로 노출합니다.", HEX.accent4],
    ["✓", "폴백은 항상 살아있다", "Claude API가 없거나 실패해도 규칙기반 진단·센싱이 기본값. 데모와 운영이 멈추지 않습니다.", HEX.accent1],
    ["✓", "로직 먼저 검증, UI 나중", "엔진 수치는 node test_*.mjs로 검증합니다. 시뮬레이션·비용모델 결과는 실측과 구분해 표기합니다.", HEX.accent6],
  ];
  const cw = 2.72, gap = 0.14;
  cards.forEach(([ic, t, d, col], i) => infoCard(s, MX + i * (cw + gap), DY, cw, 1.78, ic, t, d, col));
  const by = DY + 1.95;
  card(s, MX, by, W - 2 * MX, 1.1);
  txt(s, "기존 솔루션과 무엇이 다른가 (검증할 차별점)", { x: MX + 0.2, y: by + 0.1, w: 5, h: 0.26, fontSize: 11, bold: true, color: HEX.dk1 });
  [["기존 가시성 솔루션", "해상 운송·ETA에서 출발해 주문·비용·AI 권고까지 확장 중", HEX.dk2], ["FreshFlow AI", "한국 수입식품의 통관·검역 이력 + FC별 재고 → 센터 간 재고 밸런싱 제안", HEX.accent1]].forEach(([nme, d, col], i) => {
    const y = by + 0.42 + i * 0.3;
    pill(s, MX + 0.2, y + 0.02, 1.6, nme, col, 0.24, 8.5);
    txt(s, d, { x: MX + 1.95, y, w: 6.7, h: 0.28, fontSize: 10, color: i ? HEX.dk1 : HEX.dk2, bold: !!i, valign: "middle" });
  });
}

// ════════════ 15. 로드맵·비전 ════════════
{
  const s = contentSlide("효과와 비전", "14  로드맵과 비전",
    "다음 단계는 8주 파일럿입니다",
    "MVP 다음은 장기 계획이 아니라 고객 데이터로 하는 검증입니다. 고객사 BL과 재고 이력으로 예측 오차, 추천 채택률, 순편익을 측정하고, 그 결과로 연동과 예측 고도화의 우선순위를 정합니다.",
    "로드맵. 현재(MVP) → 8주 파일럿 → 고도화. 파일럿 지표: 1~2주 데이터 누락률·BL-SKU-FC 매핑 성공률, 3~4주 당시 확인 가능했던 정보만으로 과거 시점을 재생해 잔여 ETA 오차와 경보 정밀도·재현율 측정(현행 방식 대비), 5~6주 운영 미개입 병행 추천의 실행 가능률·담당자 채택률, 7~8주 일부 품목·FC 제한 적용 후 품절시간·폐기원가·추가 운송비를 포함한 순편익. 목표 수치는 고객 기준선 확보 후 정한다. ML은 데이터 확보 후에만 주장.");
  const phases = [
    ["NOW", "MVP · 구현 완료", ["5구간 리드타임 + 결품 진단 + 선제배치", "조기경보 · 신선도 · 비용모델", "AI 리스크 센싱 + Copilot 브리핑", "통관 실응답 검증 · 시간축 브리지 검증"], HEX.accent1],
    ["다음 8주", "고객 데이터 파일럿", ["1~2주: BL·SKU·FC 매핑, 데이터 누락률", "3~4주: 과거 시점 재생, 잔여 ETA 오차", "5~6주: 병행 추천, 담당자 채택률", "7~8주: 제한 적용, 순편익 측정"], HEX.accent6],
    ["이후", "연동과 예측 고도화", ["인증키 실호출 · Port-MIS · 식약처 · TMS", "시간축 재고를 SKU·로트 단위로 확장", "축적 이력으로 리드타임 예측 고도화", "WMS·발주·배차 API로 실행까지 연결"], HEX.dk1],
  ];
  const pw = 2.3, gap = 0.14;
  s.addShape(pres.shapes.LINE, { x: MX + 0.3, y: DY + 0.21, w: 2 * (pw + gap), h: 0, line: { color: HEX.accent5, width: 2 }, objectName: "timeline" });
  phases.forEach(([tg, t, items, col], i) => {
    const x = MX + i * (pw + gap);
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: DY + 0.11, w: 0.2, h: 0.2, fill: { color: col }, line: { color: HEX.lt2, width: 2 }, objectName: nm("dot") });
    txt(s, tg, { x: x + 0.5, y: DY + 0.05, w: 1.7, h: 0.3, fontSize: 10, bold: true, color: col, charSpacing: 1.5 });
    card(s, x, DY + 0.45, pw, DH - 0.45, { line: i === 0 ? HEX.accent1 : HEX.accent5 });
    txt(s, t, { x: x + 0.2, y: DY + 0.58, w: pw - 0.4, h: 0.32, fontSize: 13, bold: true, color: HEX.dk1 });
    bullets(s, items, { x: x + 0.2, y: DY + 0.98, w: pw - 0.4, h: DH - 1.1, fontSize: 9.5, color: HEX.dk2 });
  });
  const vx = MX + 3 * (pw + gap) - gap + 0.1, vw = W - MX - vx;
  card(s, vx, DY, vw, DH, { fill: HEX.dk1, line: HEX.dk1 });
  txt(s, "비전", { x: vx + 0.15, y: DY + 0.12, w: vw - 0.3, h: 0.26, fontSize: 9.5, bold: true, color: "B0B8C1", charSpacing: 1.5 });
  txt(s, "Ian이\n출근해서\n대시보드를\n보고\n판단·실행만\n하면 된다.", { x: vx + 0.15, y: DY + 0.4, w: vw - 0.3, h: DH - 0.5, fontSize: 12.5, bold: true, color: HEX.lt1, valign: "top", lineSpacingMultiple: 1.15 });
}

// ════════════ 16. 클로징 ════════════
pres.addSection({ title: "클로징" });
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "클로징" });
  txt(s, "FreshFlow AI", { x: MX, y: 0.62, w: 5, h: 0.5, fontSize: 18, bold: true, color: HEX.lt1 });
  s.addText("정보를 조회하고 분석은 AI가,\n판단은 사람이.", { placeholder: "title" });
  s.addText("콜드체인 Port-to-FC 관제탑 — 지금 바로 라이브 데모에서 칠레산 체리 BL을 조회해 보세요.", { placeholder: "body" });
  [["라이브 데모", "fresh-flow-ai.vercel.app"], ["소스 코드", "github.com/Rocket-Ian-lab/FreshFlowAI"], ["데모 BL", "MAEU2406CL427 (칠레산 체리 · 위기 시나리오)"]].forEach(([l, v], i) => {
    const y = 4.0 + i * 0.36;
    pill(s, MX, y + 0.04, 1.0, l, "2E3A4A", 0.26, 9);
    txt(s, v, { x: MX + 1.15, y, w: 7, h: 0.34, fontSize: 12, color: HEX.lt1, valign: "middle" });
  });
  txt(s, "Rocket_Ian_Lab  ·  AI 해커톤 · Smart Logistics", { x: W - MX - 4.5, y: H - 0.5, w: 4.5, h: 0.3, fontSize: 10, color: "8B95A1", align: "right" });
  s.addNotes("클로징. 슬로건 재강조 + 라이브 데모 링크. 예상 질의: 데이터 가용성(미연동 소스), ML 계획(Phase 3), 비용 가정, 실제 적용(BL 단위 조회·파일럿).");
}

// ── 저장 후처리: 테마 색 적용 + 지오메트리 점검(PowerPoint는 음수 크기를 거부한다) ──
(async () => {
  await pres.writeFile({ fileName: OUT });
  const zip = await JSZip.loadAsync(fs.readFileSync(OUT));
  const themePath = "ppt/theme/theme1.xml";
  const c = THEME.colors;
  const clr = (k) => `<a:${k}><a:srgbClr val="${c[k]}"/></a:${k}>`;
  const scheme = `<a:clrScheme name="${THEME.name}">${["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"].map(clr).join("")}</a:clrScheme>`;
  const theme = await zip.file(themePath).async("string");
  if (!/<a:clrScheme [\s\S]*?<\/a:clrScheme>/.test(theme)) throw new Error("theme clrScheme not found");
  zip.file(themePath, theme.replace(/<a:clrScheme [\s\S]*?<\/a:clrScheme>/, scheme));
  // 지오메트리 점검
  const presXml = await zip.file("ppt/presentation.xml").async("string");
  const [, SW, SH] = presXml.match(/<p:sldSz cx="(\d+)" cy="(\d+)"/).map(Number);
  const problems = [];
  for (const name of Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))) {
    const xml = await zip.file(name).async("string");
    for (const m of xml.matchAll(/<a:off x="(-?\d+)" y="(-?\d+)"\/>\s*<a:ext cx="(-?\d+)" cy="(-?\d+)"\/>/g)) {
      const [ox, oy, cx, cy] = m.slice(1).map(Number);
      if (cx < 0 || cy < 0) problems.push(`NEGATIVE ${name} off=(${ox},${oy}) ext=(${cx},${cy})`);
      else if (ox < 0 || oy < 0 || ox + cx > SW + 100 || oy + cy > SH + 100) problems.push(`OUT-OF-BOUNDS ${name} off=(${(ox / 914400).toFixed(2)},${(oy / 914400).toFixed(2)}) size=(${(cx / 914400).toFixed(2)},${(cy / 914400).toFixed(2)})`);
    }
  }
  if (problems.length) { console.error(problems.join("\n")); throw new Error(`geometry issues: ${problems.length}`); }
  fs.writeFileSync(OUT, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log("written:", OUT, "· slides:", Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).length);
})().catch((e) => { console.error(e); process.exit(1); });
