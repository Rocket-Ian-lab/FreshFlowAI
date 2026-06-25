# CLAUDE.md — FreshFlow AI 개발 사양서

> 이 문서는 AI 코딩 도구(Claude Code 등)와 개발자가 FreshFlow AI를 이어서 개발하기 위한 **단일 진실 소스(Single Source of Truth)**다. 모든 로직과 수치는 Node.js로 검증 완료되었다.

---

## 0. 프로젝트 한 줄 정의

수입 신선식품이 "언제 FC에 입고되어 판매가능 재고가 되는가"를 분절된 공공데이터(Port-MIS·UNI-PASS·KATI)를 통합·예측하고, FC별 결품 위험을 진단해 선제배치로 결품·폐기를 막는 콜드체인 Port-to-FC 관제 시스템.

**핵심 가치 흐름**: 정보 통합(비대칭 해소) → 이상 조기감지(정보 우위) → 선제 대응(결품·폐기 방지)

---

## 0.5 고객 정의 (모든 기능은 이 사람 기준)

> **고객 = 수입식품 유통사의 SCM Instock 담당자 "Ian"** — 입고 예측과 FC 간 재고 밸런싱을 책임지는 사람.

- **누구**: 여러 FC(물류센터)를 운영하는 수입식품 유통사의 SCM Instock 담당. 입항한 화물이 통관·운송을 거쳐 **각 FC에 언제 입고되는지** 예측하고, 센터별 재고를 보며 **결품과 과재고 사이의 균형(재고 밸런싱)**을 맞춘다.
- **KPI**: **결품률·폐기율**(+밸런싱·운송 효율). 어느 FC든 결품(품절)이나 과재고(폐기비용)가 나면 책임이 그에게 온다.
- **고통**: ① 입고 시점이 단계마다 정보가 흩어져 예측 깜깜이. ② FC별 재고를 일일이 조회해 수기로 밸런싱. ③ **FC가 두어 개일 땐 됐지만 여러 개로 늘며 자꾸 놓침** + 밸런싱용 운송 업무까지 폭증 → 버겁고, 주에도 몇 번씩 욕먹음. 새벽에 결품 연락을 받는다.
- **설계 원칙**: 모든 기능은 "Ian이 **출근해 대시보드를 보고 → 판단·실행만** 하면 되는가"로 판단한다. 사람이 하던 **자료 조회·정리·정보화·밸런싱 계산을 AI가 대신** 수행하고, 사람은 검토·실행(선제배치/이관 버튼)만. = "똘똘한 부하직원". 단순 관제가 아니라 **의사결정 + 실행 도구**.
- **왜 기존 솔루션이 이 고객을 안 풀었나**: Windward·Portcast의 고객은 화주·포워더라 관심이 ETA까지. "FC 입고 후 팔 수 있는 시점"과 "센터 간 재고 밸런싱"은 그들 관심 밖. → FreshFlow는 **유통사 SCM 관점**으로 한국 공공데이터를 입고 예측+밸런싱에 연결한다.
- **정직성 주의**: 페르소나 서술상 "머신러닝으로 예측 정확도↑"가 등장하나, 현재 구현은 **규칙기반 계산 + LLM 센싱**이다(섹션 6 "엔진 알고리즘" 정직성). 공개물엔 "AI가 조회·분석을 대신 → 사람은 판단만"으로 표기하고 ML은 **데이터 축적 후 고도화**로 둔다.

상세: `FreshFlow_고객페르소나.md`

---

## 1. 기술 스택 / 실행

- **프론트엔드**: React. `App.jsx`(상단 내비 + 뷰 전환) → `FreshFlowAI.jsx`(대시보드) / `Intro.jsx`(소개자료). 외부 상태관리 불필요, useState/useMemo만.
- **AI**: Claude API (`claude-sonnet-4-6`), 로컬은 `server.js`(Express) 프록시로 `ANTHROPIC_API_KEY` 중계. 키 없으면 규칙기반 폴백.
- **스타일**: 인라인 스타일 + **Toss 스타일 토큰**(toss.im/team 참고). 대시보드 상수 `C`, 내비 `N`(App.jsx), 소개자료 `T`(Intro.jsx) 모두 동일 팔레트: 배경 #F2F4F6 / 카드 #FFFFFF / 잉크 #191F28 / 보조 #6B7684 / 보더 #E5E8EB / **액센트 토스블루 #3182F6**(블루 forward) / semantic red #F04452·amber #FF9500·green #00B26C. 색 중앙화 → 테마 교체는 토큰 재정의만으로. **폰트: Pretendard**(한글 최적, index.html CDN) + 숫자 IBM Plex Mono. 큰 헤드라인·넉넉한 여백·부드러운 스크롤·모듈형 카드. 개인 CI(RocketIanLab)는 고유색 유지. 외부 CSS 의존 없음. 과거 지침: `Anthropic스타일_디자인가이드.md`.
- **브랜드**: 제품 로고 `Logo.jsx`(Port→FC 경로 모티프) + 개인 CI `RocketIanLab.jsx`. 둘 다 인라인 SVG, 상단 내비에 배치.
- **소개자료**: `Intro.jsx` — 발표 내용(문제→근본원인→솔루션→검증→비전)을 Anthropic 에디토리얼(세로 스크롤)로 재구성. "소개자료" 탭에서 접근. 원본 발표 덱: `FreshFlow_발표_3.html`.
- **데이터(현재)**: 컴포넌트 내장 시뮬레이션 상수. **(향후)** 공공 API 연동.
- **검증**: `node test_*.mjs` — UI 없이 순수 로직만 독립 실행해 수치 검증.

```bash
# 로직 검증 실행 예
node test_leadtime.mjs   # 리드타임 5구간
node test_risk2.mjs      # 결품 위험 + 선제배치
node test_prompt.mjs     # AI 프롬프트 구성
```

### 1.1 로컬 실행 세팅 (Claude Code 첫 작업)

현재 `FreshFlowAI.jsx`는 컴포넌트 1개만 있어 그대로는 브라우저 실행 불가. Vite로 감싸야 함. **Claude Code에게 시킬 첫 작업**:

```
CLAUDE.md를 읽고 현재 상태를 파악한 뒤,
Vite + React 환경을 구성해 FreshFlowAI.jsx를 브라우저에서 실행 가능하게 해줘.
```

기대 구성:
```
freshflow/
├── package.json          # vite, react, react-dom
├── vite.config.js        # @vitejs/plugin-react
├── index.html            # <div id="root"> + main.jsx 진입
├── src/
│   ├── main.jsx          # createRoot로 FreshFlowAI 렌더
│   └── FreshFlowAI.jsx   # (기존 파일 이동)
└── CLAUDE.md, test_*.mjs, *.md
```

- `main.jsx`: `import FreshFlowAI from "./FreshFlowAI"; createRoot(document.getElementById("root")).render(<FreshFlowAI/>)`
- 실행: `npm install && npm run dev` → localhost에서 확인
- **주의**: `FreshFlowAI.jsx`의 엔진 함수/수치는 **절대 변경 금지**(섹션 9 회귀값 유지). Vite 세팅만 추가.

### 1.2 AI Copilot API 키 (로컬 배포 시)

아티팩트 밖(로컬/서버)에서는 `https://api.anthropic.com/v1/messages` 직접 호출이 CORS·키 문제로 막힘. 로컬 실행 시 옵션:
- (a) 데모는 **규칙 기반 진단만** 사용(AI 버튼 비활성). 폴백이 항상 살아있으므로 데모 지장 없음.
- (b) 간단한 백엔드 프록시(Express)를 두고 환경변수 `ANTHROPIC_API_KEY`로 중계. Claude Code에 요청 가능.
- 발표 데모는 (a)로도 충분. AI 진단은 "있으면 보강" 기능.

---

## 2. 핵심 데이터 구조

### 2.1 리드타임 구간 (SEGMENTS)

```js
// base = 정상 소요시간(hr), drivers = {리스크키: 민감도}
// source: live(실시간) | semi(준실시간) | est(추정)
const SEGMENTS = [
  { key:"port",    name:"항만 대기·하역", base:8,  drivers:{cong:1.2, wx:0.6}, source:"live", src:"Port-MIS · AIS" },
  { key:"customs", name:"통관·검역",      base:12, drivers:{cust:1.5, wx:0.2}, source:"live", src:"UNI-PASS · KATI" },
  { key:"release", name:"컨테이너 반출",  base:4,  drivers:{cong:0.5},          source:"semi", src:"UNI-PASS 반출상태" },
  { key:"inland",  name:"냉장 내륙운송",  base:6,  drivers:{wx:0.7, cong:0.2}, source:"est",  src:"운송사 TMS(Phase2)" },
  { key:"fc_in",   name:"FC 입고 대기",   base:5,  drivers:{dock:1.0},          source:"live", src:"자사 WMS Dock" },
];
```

### 2.2 리스크 입력 (RISKS) — 0~1 스케일

```js
const RISKS = [
  { key:"cong", name:"항만 혼잡도" },
  { key:"cust", name:"통관·검역 리스크" },
  { key:"wx",   name:"기상 리스크" },
  { key:"dock", name:"FC Dock 혼잡" },
];
// 시나리오 프리셋
const NORMAL = { cong:0.2, cust:0.2, wx:0.1, dock:0.2 }; // 평소
const CRISIS = { cong:0.7, cust:0.6, wx:0.4, dock:0.5 }; // 위기
```

### 2.3 FC 재고 (FC_INIT)

```js
const FC_INIT = [
  { id:"FC001", name:"인천 FC", stock:1400, demand:1000, safety:1.5 }, // 결품위기
  { id:"FC002", name:"김포 FC", stock:5200, demand:1000, safety:1.5 }, // 과재고
  { id:"FC003", name:"용인 FC", stock:700,  demand:1200, safety:1.5 }, // 심각
  { id:"FC004", name:"안성 FC", stock:4800, demand:800,  safety:1.5 }, // 과재고
];
// stock=현재재고(units), demand=일일수요, safety=안전재고 일수
```

### 2.4 시연용 가상 BL (MOCK_BLS)

화면 ⓪ "화물 조회"에서 BL/화물관리번호로 특정 화물을 조회 → 그 화물의 `risk`·`vol`을 엔진에 주입하는 진입점. 실제 운영 시 **UNI-PASS 화물통관진행정보 API**(BL/화물관리번호 조회)로 `stage`(현재 진행단계)·구간 리스크를 받아 이 상수를 대체한다(섹션 5의 어댑터 레이어).

```js
const STAGE_ORDER = ["port","customs","release","inland","fc_in"]; // 진행 스테퍼 순서
const MOCK_BLS = [ // bl, item, origin, pod, vessel, vol, stage, risk{cong,cust,wx,dock}, note
  { bl:"MAEU2406CL427", item:"칠레산 체리",  vol:4000, stage:"customs", risk:CRISIS }, // 위기 데모 = 섹션 9 회귀
  { bl:"ONEY2406NO113", item:"노르웨이 연어", vol:2000, stage:"inland",  risk:NORMAL }, // 평소
  { bl:"HLCU2406VN815", item:"베트남 생망고", vol:3000, stage:"port",    risk:{cong:.6,cust:.4,wx:.3,dock:.3} },
  { bl:"COSU2406US309", item:"미국산 오렌지", vol:1500, stage:"release", risk:{cong:.3,cust:.5,wx:.2,dock:.4} },
];
```
- **칠레산 체리 BL**: risk=CRISIS·vol=4000 → 엔진 그대로 통과해 **61.8h / High 2개 / 선제배치(인천+1559·용인+2441)** 재현(섹션 9). BL 경로로도 회귀값 보존.
- 조회: `lookupBl(q)`(대소문자·하이픈·공백 무시) → `applyBl(b)`가 `setRisk`/`setVol`. 슬라이더는 이후 what-if 수동 조정용으로 살아있음.
- UI: 선택 시 품목·출발지→도착항·선명·물량 + **통관 진행 스테퍼**(5구간 중 `stage` 하이라이트) 표시.

---

## 3. 검증된 엔진 로직 (그대로 사용)

### 3.1 리드타임 계산

```js
function computeLeadtime(risk) {
  const seg = SEGMENTS.map((s) => {
    let m = 1;
    for (const [d, sn] of Object.entries(s.drivers)) m += (risk[d] || 0) * sn;
    return { name:s.name, hours:s.base*m, base:s.base, source:s.source, src:s.src };
  });
  const total = seg.reduce((a, b) => a + b.hours, 0);
  return { seg, total }; // ltDays = total / 24
}
```
**검증값**: NORMAL → 43.3h(1.80일), CRISIS → 61.8h(2.58일). 위기 시 최대 지연: 통관(+7.9h), 항만(+6.2h).

### 3.2 결품 위험 판정

```js
function assess(fcs, ltDays) {
  return fcs.map((f) => {
    const coverage = f.stock / f.demand;
    const gap = coverage - ltDays;
    return { ...f, coverage, gap, risk: gap<0 ? "High" : gap<1 ? "Medium" : "Low" };
  });
}
```

### 3.3 선제배치 추천 (2단계)

```js
function recommend(fcsInit, ltDays, vol) {
  const after = fcsInit.map((f) => ({ ...f }));
  const actions = [];
  let pool = vol;
  // 1단계: 신규 선적을 (안전재고+리드타임) 목표 부족분 비례로 위험FC 우선배정
  const needs = after.map((f) => ({ f, need: Math.max(0, Math.ceil((f.safety+ltDays)*f.demand - f.stock)) }));
  const tot = needs.reduce((a, b) => a + b.need, 0);
  if (tot > 0) needs.forEach((n) => {
    if (pool<=0 || n.need<=0) return;
    const give = Math.min(n.need, Math.round(vol*n.need/tot), pool);
    n.f.stock += give; pool -= give;
    if (give>0) actions.push(`신규 선적 → ${n.f.name}: ${give.toLocaleString()}개 우선배정`);
  });
  if (pool > 0) { // 잔여는 가장 위험한 FC에
    const worst = assess(after, ltDays).sort((a,b)=>a.gap-b.gap)[0];
    const tf = after.find((f)=>f.id===worst.id);
    tf.stock += pool; actions.push(`잔여 물량 → ${tf.name}: ${pool.toLocaleString()}개`);
  }
  // 2단계: 여전히 High면 과재고(gap>1) FC에서 이관
  for (const hf of assess(after, ltDays).filter((f)=>f.risk==="High")) {
    const tf = after.find((f)=>f.id===hf.id);
    const target = Math.ceil((hf.safety+ltDays)*hf.demand);
    let need = target - tf.stock;
    const donors = assess(after, ltDays).filter((f)=>f.id!==hf.id && f.gap>1).sort((a,b)=>b.gap-a.gap);
    for (const d of donors) {
      if (need<=0) break;
      const df = after.find((f)=>f.id===d.id);
      const spare = Math.floor((d.gap-1)*d.demand);
      if (spare<=0) continue;
      const mv = Math.min(need, spare);
      df.stock -= mv; tf.stock += mv; need -= mv;
      actions.push(`재고 이관: ${d.name} → ${hf.name} ${mv.toLocaleString()}개`);
    }
  }
  return { after, actions };
}
```
**검증값**: CRISIS(2.58일), vol=4000 → 인천 1559 + 용인 2441 배정 → High 2개→0개.

---

## 4. AI Copilot (요나) — Claude API 연동

### 4.1 설계 원칙 (필수)

- **규칙 기반 진단을 기본값으로 항상 표시.** API 없이도, 실패해도 데모는 멈추지 않는다.
- "AI 상세 진단" 버튼 클릭 시에만 API 호출 → 자연어 브리핑으로 **보강**(대체 아님).
- 상태: `aiText`(결과), `aiLoading`(로딩), `aiError`(실패). 실패 시 주황색 안내 + 규칙기반 유지.

### 4.2 프롬프트 구성 (엔진 수치 주입)

엔진이 계산한 리드타임 구간·FC 리스크·추천 결과를 텍스트로 묶어 system 역할 부여. 요청: **3개 라벨 섹션**(`진단|` 가장 위급한 상황과 원인 구간 / `조치|` 권장 조치와 기대효과 / `실행|` 당장 챙길 실무 액션), 각 항목은 머리말+세로줄(|)로 시작하는 한 줄, 표·불릿·마크다운 기호 없이 자연스러운 문장. 프론트는 `parseAiSections()`로 라벨을 파싱해 색상 카드로 렌더(가독성). 형식 미준수 시 문장 단위 줄바꿈 폴백. 상세 구현은 `FreshFlowAI.jsx`의 `runAiDiagnosis()` 참조.

### 4.3 API 호출 형식

```js
fetch("https://api.anthropic.com/v1/messages", {
  method:"POST",
  headers:{ "Content-Type":"application/json" },
  body: JSON.stringify({
    model:"claude-sonnet-4-20250514",
    max_tokens:1000,
    messages:[{ role:"user", content: prompt }],
  }),
});
// 응답: data.content[].filter(b=>b.type==="text").map(b=>b.text).join("\n")
```

---

## 5. 데이터 소스 연동 (공공 API)

| 구간 | API | 상태 | 비고 |
|---|---|---|---|
| 항만 | 해수부 **Port-MIS** 선박입항·관제정보 (공공데이터포털) + AIS | 신청 즉시 가능 | 입출항 시각, 선박위치 |
| 통관 | 관세청 **UNI-PASS** 화물통관진행정보 API | 신청 즉시 가능 | 화물관리번호/BL로 진행단계 조회(XML) |
| 통관리스크 | aT **KATI** 농식품 통관문제 사례 API | 가능 | 검역 불합격 사유·발생연월 |
| FC입고 | 자사 **WMS** Dock | 자사 시스템 | 완전 실시간 |
| 내륙운송 | 운송사 **TMS**/GPS | Phase 2 | 표준화 미비, MVP는 추정 |

**연동 시 주의**: API는 원시 진행단계(이벤트)를 주므로, 이를 "구간 경과시간"으로 변환하는 어댑터 레이어가 필요. 현재 시뮬레이션 상수(base×리스크)를 이 어댑터 출력으로 교체하면 됨. 즉 **엔진 인터페이스는 그대로, 데이터 소스만 교체**하는 구조.

---

## 6. 향후 개발 (우선순위)

### ▶ 다음 작업 우선순위 (Claude Code 진입 시 이 순서로)

1. **[필수·먼저] 로컬 실행 세팅** — Vite+React로 `FreshFlowAI.jsx`를 띄운다(섹션 1.1). 데모를 실제로 돌릴 환경 확보.
2. **[권장] 화면 문구를 SCM 담당자 관점으로** — "Ian이 보고 판단·실행만" 시점으로 카피 조정(섹션 0.5). 기능 로직은 그대로, 라벨·안내문만. (소개자료 `Intro.jsx`는 반영 완료)
3. **[선택] Phase 2-B: 정보 비대칭 시각화** — 정보원(항만/통관/운송/FC)을 on/off하면 끌수록 리드타임 예측 오차↑·결품위험↑. "정보 통합이 곧 조기경보 능력"을 체험시킴. baseline이 흐려지는 효과로 구현.
4. **[선택] Phase 2-C: 운송사 TMS 연동** — 내륙운송 구간 추정 → 실시간 격상.

> **중요**: 새 기능 추가 전에 항상 `test_*.mjs`로 로직 검증부터(개발 원칙 2). 섹션 9 회귀값이 깨지지 않는지 확인.

### Phase 2-A: 이상 신호 조기경보 (✅ 구현 완료)
- **목표**: 평소 패턴(baseline) 대비 이탈을 결품 발생 **전에** 경보.
- **방법**: `detectEarlyWarning()` — 최근 12관측 baseline 대비 z-score>1.8 + 추세 상승 + 5틱 외삽이 임계의 90% 초과 시 경보.
- **UI**: "실시간 모니터링 시작" → 리스크 점진 악화 시계열(1틱=30분, 40틱) → 추이 미니차트 + 경보 배너.
- **검증값** (`test_earlywarn.mjs`, 200회): 결품 전 경보 100%, **평균 선행 7.4시간**, **오경보율 1.5%**.

### 주문 시점 제안 Two-way (✅ 구현 완료)
- **함수**: `suggestOrder(fc, ltDays, nowHr=9, safetyBufHr=6)` + `fmtHr()`
- **Way 1 (Risk 진단, feasible=false)**: DOC<리드타임이면 "이관 필요", "결품 막으려면 ○○까지 주문했어야"를 역산 표시.
- **Way 2 (정상계획, feasible=true)**: DOC+**창고 가동률** 기반 발주마감·발주량. 발주량>여유공간이면 "분할발주 권장".
- **공식**: 발주마감 = 결품시점 − 리드타임×24 − 안전버퍼 / 가동률=재고/용량 / 공간부족=발주량−용량×(1−가동률)
- **검증** (`test_orderpoint2/3.mjs`): DOC 같아도 가동률 92% vs 61%면 결정 갈림(단순 ROP 대비 차별점).
- **데이터**: `FC_INIT[].capacity` 필드 필요.

### 신선도(상품가치 손실) 위험 지표 (✅ 구현 완료)
- **목표**: 콜드체인의 핵심은 '시간'뿐 아니라 '온도'. 리드타임↑·폭염(wx)↑ → 상품가치 손실을 MD에게 직격으로 보여줌.
- **함수**: `computeFreshnessRisk(ltDays, wx, perish=1.0)` — 콜드체인 정상 허용일(`FRESH.hold`=2일) 초과분에 품목 perishability와 온도리스크 가속(`baseLoss`6%/일 × (1+wx×`heatK`1.5))을 곱해 손실률 누적, 상한 45%.
- **데이터**: `MOCK_BLS[].perish`(체리 2.0·망고 1.6·연어 1.4·오렌지 0.8), 미선택 시 기본 1.0.
- **UI**: 섹션 ②에 "🌡️ 예상 상품가치 손실 위험 N% · 등급" 칩. AI 프롬프트에도 주입.
- **검증값** (`test_freshness.mjs`): 평소 0%(콜드체인 정상), 위기 일반 5.5%, **위기 체리 11%(High)**, 위기 오렌지 4.4%.
- **정직성**: ML 아님. 명백한 휴리스틱(시나리오 기반)임을 코드 주석·문구로 명시.

### 이상치(Anomaly) 하이라이트 (✅ 구현 완료)
- **목표**: 섹션 ②-B의 z-score 로직을 정적 뷰에도 직관화. "평소보다 N배 더 소요 중"을 바 옆에 표시.
- **방법**: 각 구간 `ratio = hours/base`. `ratio≥1.5`면 빨강 배지 `⚠ 평소 ×N.N`. 정적 뷰엔 시계열이 없으므로 z-score 대신 정상 대비 배수(정직한 등가물). 진짜 z-score는 ②-B 모니터링에 존재.
- **검증**: 위기 시 통관 ×2.0, 항만 ×2.1, FC입고 ×1.5 (회귀값 61.8h와 일치).

### 비용 임팩트 대시보드 (✅ 구현 완료)
- **목표**: 모든 기능을 돈으로 환산 — 페르소나 KPI(결품률·폐기율)를 ₩로 직결. "선제조치 안 함 vs FreshFlow 적용" 비교.
- **함수**: `computeCostImpact(beforeFcs, afterFcs, ltDays, vol, price)`.
  - **적용 전(선제조치 X)**: 현재 재고 그대로 → 결품 예상손실(부족분 `ltDays×demand−stock` × 단가 × 마진율 `lostMargin`30%) + 재고폐기 예상손실(목표초과 잉여 `stock−(safety+ltDays)demand` × 단가 × 폐기율 `spoilRate`50%). 운송비 0.
  - **적용 후(FreshFlow)**: 신규선적 배치 + 과재고를 미달 FC로 이관 → 결품·폐기 감소, 대신 운송비 투입(배치 `inbound`250/개 + 이관 `transfer`700/개).
- **데이터**: `MOCK_BLS[].price`(체리 12000·연어 9000·망고 6000·오렌지 4000), 미선택 시 `COST.defaultPrice`7000.
- **UI**: 섹션 ⑥ — Stripe 큰-숫자 KPI 3개(적용 전/후/절감액·%) + 결품·폐기 Before/After 비교 바 + 운송비 투입 라인(`Stat`,`ComparBar`). AI 프롬프트에도 주입. 가정 명시.
- **검증값** (`test_costimpact.mjs`, 위기·체리 12000): 적용 전 ₩2,882만(결품 3,565개+폐기 2,665개) → 적용 후 ₩287만(결품·폐기 0, 운송비 배치4000+이관2665) → **순절감 ₩2,596만(90%)**.
- **정직성**: 폐기는 "선제조치 안 하면 발생할 예상손실"로 정의 → 이관으로 해소. 운송비를 비용으로 명시해 "운송비 투입 < 결품·폐기 절감"의 순ROI를 정직하게 표현.

### Phase 2-D: ETA 고도화 (미구현 — 데이터 필요)
> 외부 평가 조언(2번) 반영. **정직성 원칙**상 분포 데이터 없이 확률 ETA를 단정하지 않음 — 데이터 확보 후 단계 격상.
- **확률형 통관 ETA**: 과거 품목·월별 검역 지연 분포 + 무작위 샘플링·정밀검사 트렌드 + 관세사/보세창고 혼잡도 → P50/P90 범위. 데이터: aT KATI 사례 이력, UNI-PASS 진행 로그 축적.
- **Reefer 동적 ETA**: 냉장 탑차 가용성·요일/시간대별 배차 성공확률. 물동량(신규선적 슬라이더)↑ 시 트럭 매칭 대기↑. 데이터: 운송사 TMS/배차(Phase 2-C와 연동).

### Phase 2-E: Prescriptive(처방) 액션 (✅ 구현 완료)
> 외부 평가 조언(3번) 반영. 경보에서 끝내지 않고 "해결책 버튼"까지. 기존 엔진 결과 위에 얹어 추가 데이터 없이 구현.
- **함수/상태**: `actionItems`(useMemo, 엔진 상태→조치 카드 생성) + `runAction(item)` + `actionLog` 상태.
- **생성 규칙**: ① 결품 High 존재+추천 있음 → "선제배치 실행"(`rec.actions` 내역, `apply:'after'`). ② `risk.dock≥0.4` → "FC 입고 슬롯 조정". ③ 선제배치 후에도 `aHigh>0` → "대체 공급처 밀크런"(부족분 환산).
- **UI**: 섹션 ⑤ 카드(근거·내역·기대효과 + CTA 버튼). 클릭 시 `✓ 실행됨`+실행 로그, **선제배치는 ③ 뷰를 AFTER로 전환**해 결품 해소를 즉시 시각화. 시나리오/BL 변경 시 로그·뷰 초기화.
- **정직성**: "데모 — 실제 운영 시 WMS/발주/배차 API로 실행" 명시. 위기·체리 BL 시 2개 카드(배치·슬롯), vol 낮추면 밀크런 카드 등장.

### AI 리스크 센싱 (✅ 구현 완료) — LLM이 엔진을 *구동*
> 평가 조언 "③ AI 기술 타당성" 반영. LLM을 결과 설명자에서 → **의사결정 입력 생성자**로 격상. "이게 왜 AI냐"에 정면 대응.
- **함수/상태**: `runRiskSensing()`(Claude 호출→리스크 JSON 파싱) + `keywordSense()`(규칙기반 폴백, `test_sensing.mjs` 검증) + `animateRiskTo()`(슬라이더 부드러운 이동, rAF + setTimeout 안전장치) + 상태 `senseText/sensing/senseResult/senseError`.
- **흐름**: 비정형 텍스트(뉴스·UNI-PASS 공지·기상특보) → **Claude가 리스크 4종{cong,cust,wx,dock} JSON + 항목별 근거 + 확률형 통관 ETA(P50/P90) 도출** → 슬라이더 자동 조정 → 리드타임·결품·비용 엔진 재계산.
- **UI**: 섹션 "✦ AI 리스크 센싱" — textarea(평시/위기 프리셋), "AI로 리스크 자동 도출" 버튼, 근거 매핑 칩(설명가능성), 확률형 ETA 카드, 출처 배지(AI/폴백).
- **검증**(`test_sensing.mjs`): 평시 ~0.12, 위기 cong .59·cust .64·wx .60·dock .59 + ETA. 라이브 LLM 실측: 위기문 → cong .82·cust .75·wx .70·dock .85, ETA P50 18h/P90 36h(근거 포함).
- **정직성**: 텍스트 **수집**(뉴스·UNI-PASS 라이브 크롤링)은 데모 범위 밖 → 큐레이션 샘플/붙여넣기. **리스크 추출은 실제 LLM**, ETA는 추정임을 화면 명시. 무키/실패 시 규칙기반 폴백.

### Phase 2-F: 시나리오 자동화 — 라이브 소스 (미구현 — Phase 3급)
> 위 AI 리스크 센싱의 **입력 자동화** 단계. 기상청 태풍예보·항만 파업 뉴스·UNI-PASS 마비 징후를 실시간 크롤링/RAG → 센싱 자동 트리거. **주의**: 출처·신뢰도 투명 공개 필수(정직성).

### Phase 2-B: 정보 비대칭 시각화 (미구현)
- **목표**: 정보원 on/off로 "정보 통합 = 조기경보 능력"을 체험. 강의(6.5 정보 비대칭) 정면.
- **방법**: 4개 정보원(항만/통관/운송/FC) 토글. 끌수록 해당 구간이 "추정"으로 바뀌어 예측 분산↑, baseline 신뢰도↓ → 조기경보 선행시간↓·오경보↑. "정보가 단절되면 늦게 알거나 못 잡는다"를 수치로.
- **Harness**: 정보원 N개 끄면 조기경보 선행시간이 단조 감소하는가 검증.

### Phase 2-C: 운송사 TMS 연동
- 내륙운송 구간을 추정 → 실시간으로 격상.

### Phase 3: 예측 모델 고도화
- 실데이터 확보 시 리드타임 ML 예측. **주의**: 데이터 없이 ML 정확도를 주장하지 말 것(순환논리). 현재는 리스크 기반 시나리오 시뮬레이션이 정직한 접근.
- FC 간 이관 비용·신선도 손실(유통기한)을 목적함수에 반영.

---

## 7. 개발 원칙 (이 프로젝트의 합의된 방식)

1. **Prompt-Context-Harness-Loop**: 목표 정의 → 맥락 선별 → 검증기준 수립 → 통과까지 반복.
2. **로직 먼저 검증, UI 나중**: 새 로직은 `test_*.mjs`로 수치 검증 후 컴포넌트에 반영.
3. **정직한 설계**: 데이터 가용성을 배지로 투명 공개. "다 된다"고 우기지 않음.
4. **데모 안정성 최우선**: 외부 의존(API)은 항상 폴백을 둠. 발표 중 멈추지 않는 게 최우선.
5. **강의 정렬**: 모든 기능은 5 Why 근본원인(정보 단절·조기감지 부재)에서 역산. 근본원인을 때리지 않는 기능은 보류.

---

## 8. 파일 구조

```
AI 해커톤/                     # Vite + React 프로젝트 루트
├── index.html                # 진입 (Google Fonts: Poppins/Lora 로드)
├── vite.config.js            # @vitejs/plugin-react + /api → 프록시(8787)
├── server.js                 # Claude API 프록시(Express) — ANTHROPIC_API_KEY 중계
├── src/
│   ├── main.jsx              # createRoot로 <App/> 렌더
│   ├── App.jsx               # 상단 내비 + 뷰 전환(대시보드/소개자료)
│   ├── FreshFlowAI.jsx       # 대시보드 (검증 엔진 + UI + AI + 조기경보 + 주문제안 + 선제조치 + 비용임팩트)
│   ├── Intro.jsx             # 소개자료 (Anthropic 에디토리얼)
│   ├── Logo.jsx              # 제품 로고(SVG)
│   └── RocketIanLab.jsx      # 개인 CI(SVG)
├── public/favicon.svg
├── CLAUDE.md                 # 이 문서 (개발 사양서) — Claude Code가 먼저 읽음
├── Anthropic스타일_디자인가이드.md  # UI 디자인 지침
├── FreshFlow_개발보고서.md · FreshFlow_고객페르소나.md · FreshFlow_발표_3.html
└── test_*.mjs                # 로직 검증 (freshness/costimpact 등)
```

---

## 9. 검증된 핵심 수치 (회귀 테스트 기준값)

| 항목 | 입력 | 기대 출력 |
|---|---|---|
| 리드타임 평소 | NORMAL | 43.3h (1.80일) |
| 리드타임 위기 | CRISIS | 61.8h (2.58일) |
| 최대 지연 구간(위기) | CRISIS | 통관(+7.9h), 항만(+6.2h) |
| 결품 High(BEFORE) | CRISIS | 인천·용인 (2개) |
| 선제배치 | CRISIS, vol=4000 | 인천+1559, 용인+2441 |
| 결품 High(AFTER) | 위 적용 후 | 0개 |
| 신선도 손실(평소) | NORMAL, perish 1.0 | 0% (Low, 콜드체인 정상) |
| 신선도 손실(위기·체리) | CRISIS, perish 2.0 | 11% (High) |
| 이상치 배수(위기) | CRISIS | 통관 ×2.0, 항만 ×2.1, FC입고 ×1.5 |
| 비용 임팩트(위기·체리) | CRISIS, price 12000 | 적용 전 ₩2,882만 → 후 ₩287만(운송비), 순절감 ₩2,596만(90%) |

로직 수정 시 이 값들이 유지되는지 `test_*.mjs`로 확인할 것.
