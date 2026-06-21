import React, { useState, useRef, useEffect } from "react";
import Logo from "./Logo";

/* 소개자료 (Intro) — Anthropic 에디토리얼 스타일 + 절제된 모션.
   크림 배경 + 세리프 본문(Lora) + 산세리프 헤딩(Poppins) + 테라코타 액센트(절제) + 넉넉한 여백.
   모션은 가이드 §5 준수: 부드러운 fade/up, 인라인 SVG 일러스트, prefers-reduced-motion 존중. */

const T = {
  ink: "#191F28", paper: "#FFFFFF", card: "#FFFFFF", mid: "#8B95A1",
  dim: "#6B7684", line: "#E5E8EB", accent: "#3182F6", blue: "#3182F6", green: "#00B26C",
  display: "'Pretendard Variable', Pretendard, system-ui, -apple-system, sans-serif",
  body: "'Pretendard Variable', Pretendard, system-ui, -apple-system, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 스크롤 진입 시 fade-up 등장
function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion()) { setShown(true); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } });
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: shown ? 1 : 0,
      transform: shown ? "none" : "translateY(24px)",
      transition: `opacity .6s ease ${delay}ms, transform .6s cubic-bezier(.22,.61,.36,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

// 화면 진입 시 숫자 카운트업
function CountUp({ value, decimals = 0, prefix = "", suffix = "", duration = 1300 }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion()) { setN(value); return; }
    let raf, start;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const step = (t) => {
          if (!start) start = t;
          const p = Math.min(1, (t - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(value * eased);
          if (p < 1) raf = requestAnimationFrame(step); else setN(value);
        };
        raf = requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={ref}>{prefix}{n.toFixed(decimals)}{suffix}</span>;
}

// 솔루션 카드 아이콘
function CardIcon({ kind, color }) {
  const p = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "collect") return (<svg {...p}><path d="M3 5h18M6 10h12M9 15h6M11 20h2" /></svg>);
  if (kind === "detect") return (<svg {...p}><path d="M2 12h4l2.5-7 4 14 2.5-7H22" /></svg>);
  return (<svg {...p}><path d="M4 12h13M12 6l6 6-6 6" /></svg>);
}

// Port → FC 여정 일러스트 (라인 드로잉 + 이동하는 점)
function JourneyGraphic() {
  const stages = [
    { x: 70, label: "항만 대기" },
    { x: 250, label: "통관·검역" },
    { x: 430, label: "냉장 내륙" },
    { x: 610, label: "FC 입고" },
  ];
  const last = stages.length - 1;
  return (
    <svg viewBox="0 0 680 130" style={{ width: "100%", maxWidth: 700, height: "auto" }} role="img" aria-label="Port에서 FC까지의 여정">
      <defs>
        <linearGradient id="introRoute" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#9DC4FF" /><stop offset="1" stopColor="#3182F6" />
        </linearGradient>
      </defs>
      <line x1="70" y1="60" x2="610" y2="60" stroke={T.line} strokeWidth="2" />
      <line x1="70" y1="60" x2="610" y2="60" stroke="url(#introRoute)" strokeWidth="3" strokeLinecap="round"
        style={{ strokeDasharray: 540, strokeDashoffset: 540, animation: "ff-draw 1.8s ease .3s forwards" }} />
      <circle r="6" fill={T.accent}>
        <animateMotion dur="3.4s" repeatCount="indefinite" path="M70 60 L610 60" />
      </circle>
      {stages.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy="60" r={i === last ? 9 : 6} fill={i === last ? T.accent : T.card}
            stroke={i === last ? T.accent : T.blue} strokeWidth="3"
            style={i === last ? { animation: "ff-pulse 3s ease-in-out 1.6s infinite" } : undefined} />
          <text x={s.x} y="96" textAnchor="middle" fontFamily={T.display} fontSize="13" fill={T.dim}>{s.label}</text>
        </g>
      ))}
      <text x="70" y="32" textAnchor="middle" fontFamily={T.display} fontSize="11" fill={T.mid}>선박 도착</text>
      <text x="610" y="32" textAnchor="middle" fontFamily={T.display} fontSize="11" fontWeight="600" fill={T.accent}>판매 가능 재고</text>
    </svg>
  );
}

// 정보 단절 → 통합 일러스트
function IntegrationGraphic() {
  const sources = [
    { y: 26, label: "항만 Port-MIS" },
    { y: 62, label: "통관 UNI-PASS" },
    { y: 98, label: "검역 KATI" },
    { y: 134, label: "FC WMS" },
  ];
  return (
    <svg viewBox="0 0 420 160" style={{ width: "100%", maxWidth: 440, height: "auto" }} role="img" aria-label="분절된 데이터의 통합">
      {sources.map((s, i) => (
        <g key={i}>
          <path d={`M120 ${s.y} C 210 ${s.y}, 250 80, 320 80`} fill="none" stroke={T.line} strokeWidth="1.5"
            style={{ strokeDasharray: 260, strokeDashoffset: 260, animation: `ff-draw 1.2s ease ${0.2 + i * 0.15}s forwards` }} />
          <circle cx="110" cy={s.y} r="5" fill={T.blue} />
          <text x="100" y={s.y + 4} textAnchor="end" fontFamily={T.display} fontSize="11" fill={T.dim}>{s.label}</text>
        </g>
      ))}
      <circle cx="320" cy="80" r="16" fill={T.accent} style={{ animation: "ff-pulse 3s ease-in-out 1.2s infinite" }} />
      <text x="320" y="84" textAnchor="middle" fontFamily={T.display} fontSize="11" fontWeight="600" fill="#fff">통합</text>
      <text x="320" y="120" textAnchor="middle" fontFamily={T.display} fontSize="12" fill={T.ink}>FreshFlow</text>
    </svg>
  );
}

const Kicker = ({ children }) => (
  <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 600, letterSpacing: 2,
    textTransform: "uppercase", color: T.mid, marginBottom: 16 }}>{children}</div>
);
const H2 = ({ children, light }) => (
  <h2 style={{ fontFamily: T.display, fontWeight: 700, fontSize: "clamp(1.9rem,3.6vw,2.9rem)",
    lineHeight: 1.18, color: light ? T.paper : T.ink, margin: "0 0 24px", letterSpacing: -0.8 }}>{children}</h2>
);
const Lead = ({ children, style }) => (
  <p style={{ fontFamily: T.body, fontSize: "1.2rem", lineHeight: 1.75, color: "#4E5968", margin: "0 0 18px", letterSpacing: -0.2, ...style }}>{children}</p>
);
const Section = ({ children, dark, divider }) => (
  <section style={{
    background: dark ? T.ink : "transparent",
    borderTop: divider ? `1px solid ${T.line}` : "none",
    padding: "clamp(56px,9vw,104px) 24px",
  }}>
    <div style={{ maxWidth: 920, margin: "0 auto" }}>{children}</div>
  </section>
);

export default function Intro({ onLaunch }) {
  const accent = (s) => <span style={{ color: T.accent }}>{s}</span>;

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: T.body }}>
      <style>{`
        @keyframes ff-draw { to { stroke-dashoffset: 0; } }
        @keyframes ff-pulse { 0%,100%{ filter:drop-shadow(0 0 2px rgba(49,130,246,.45)); } 50%{ filter:drop-shadow(0 0 9px rgba(49,130,246,.85)); } }
        @keyframes ff-float { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-6px);} }
        @keyframes ff-bob { 0%,100%{ transform:translateY(0); opacity:.5; } 50%{ transform:translateY(7px); opacity:1; } }
        .intro-card{ transition: transform .3s ease, border-color .3s ease, box-shadow .3s ease; }
        .intro-card:hover{ transform: translateY(-3px); border-color:#D1D6DB; box-shadow:0 8px 26px rgba(0,27,55,.08); }
        .intro-cta{ transition: opacity .25s ease, transform .25s ease; }
        .intro-cta:hover{ opacity:.9; transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce){ *{ animation:none !important; transition:none !important; } }
      `}</style>

      {/* HERO */}
      <section style={{ padding: "clamp(56px,10vw,116px) 24px clamp(40px,6vw,72px)" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <span style={{ display: "inline-flex", animation: reduceMotion() ? "none" : "ff-float 5s ease-in-out infinite" }}><Logo size={54} /></span>
              <span style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500, color: T.dim, letterSpacing: 1 }}>
                콜드체인 Port-to-FC 관제탑
              </span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 style={{ fontFamily: T.display, fontWeight: 700, fontSize: "clamp(3.2rem,7.5vw,5.6rem)",
              lineHeight: 1.04, letterSpacing: -2, margin: "0 0 30px" }}>
              발주를 더 이상<br />도박하지 않게.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <Lead style={{ fontSize: "1.4rem", maxWidth: 740, color: "#4E5968" }}>
              "선박이 언제 도착하는가"가 아니라 — <span style={{ color: T.ink, fontWeight: 600 }}>언제 FC에 입고되어 판매 가능한 재고가 되는가.</span>
              분절된 공공데이터(Port-MIS·UNI-PASS·KATI)를 통합해, 수입 신선식품 바이어의 발주 결정을 돕습니다.
            </Lead>
          </Reveal>
          <Reveal delay={240}>
            <div style={{ margin: "40px 0 8px" }}><JourneyGraphic /></div>
          </Reveal>
          <Reveal delay={320}>
            <button onClick={onLaunch} className="intro-cta" style={{
              fontFamily: T.display, fontWeight: 600, fontSize: 16, cursor: "pointer", marginTop: 20,
              background: T.ink, color: T.paper, border: "none", borderRadius: 10, padding: "15px 30px" }}>
              라이브 대시보드 열기 →
            </button>
          </Reveal>
          <Reveal delay={420}>
            <div style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: T.display, fontSize: 12, color: T.mid, letterSpacing: 1 }}>아래로 스크롤</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.mid} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: reduceMotion() ? "none" : "ff-bob 1.8s ease-in-out infinite" }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 문제 */}
      <Section divider>
        <Reveal><Kicker>누구의, 얼마나 중요한 문제인가</Kicker></Reveal>
        <Reveal delay={60}><H2>Ian은 매일 ‘발주 도박’을 한다</H2></Reveal>
        <Reveal delay={120}>
          <Lead>
            우리의 고객은 대형마트·식품 이커머스의 <strong>수입 신선식품 바이어(MD)</strong> ―
            무엇을, 얼마나, 언제 발주할지 직접 결정하고 실행하는 사람입니다.
            그의 KPI는 매출·마진, 그리고 <strong>결품률과 폐기율</strong>. 결품도 폐기도 결국 ‘바이어의 발주 실수’로 귀결됩니다.
          </Lead>
        </Reveal>
        <Reveal delay={160}>
          <Lead>
            그런데 통관 일정이 깜깜이라, 그는 매번 감(感)으로 발주합니다. 늦을까 봐 과발주하면 한꺼번에 들어와 폐기되고,
            적게 발주하면 매대가 빕니다. 어느 쪽이든 그의 책임입니다.
          </Lead>
        </Reveal>
        <Reveal delay={200}>
          <p style={{ fontFamily: T.display, fontSize: 14, color: T.dim, marginTop: 8 }}>
            FAO — 식품 손실의 4천억 달러가 매장 도달 전 발생 · 업계 94%가 “공급망 가시성 부재”를 최대 장애물로 지목.
          </p>
        </Reveal>
      </Section>

      {/* 근본원인 */}
      <Section divider>
        <Reveal><Kicker>왜 여태 해결되지 않았나</Kicker></Reveal>
        <Reveal delay={60}><H2>문제는 ‘정보 단절’ — 그리고 한 단계 더</H2></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 28, alignItems: "center" }}>
          <Reveal delay={120}>
            <Lead>
              항만·통관·운송·FC의 데이터가 각자 흩어져 있어 ‘끝점’을 아무도 예측하지 않습니다. 그래서 FC마다 과대/과소 주문이 생기고,
              재고가 잘못된 곳에 쌓여 결품과 폐기가 동시에 일어납니다.
            </Lead>
          </Reveal>
          <Reveal delay={180} style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
            <IntegrationGraphic />
          </Reveal>
          <Reveal delay={220}>
            <Lead>
              “그런 솔루션은 이미 있지 않나? Windward, Portcast.” 맞습니다. 그러나 그들의 고객은 <strong>화주·포워더</strong>여서
              관심은 ‘배가 어디 있나(ETA)’까지입니다. ‘FC에 입고돼 바이어가 팔 수 있는 시점’은 그들의 관심 밖입니다.
            </Lead>
          </Reveal>
          <Reveal delay={260}>
            <Lead style={{ marginBottom: 0 }}>
              {accent("진짜 근본원인")}은 수단의 부재가 아니라, <strong>이 고객(바이어)을 위해 분절된 한국 공공데이터를
              발주 결정으로 엮을 이유를 가진 사람이 없었다</strong>는 것입니다.
            </Lead>
          </Reveal>
        </div>
      </Section>

      {/* 솔루션 */}
      <Section divider>
        <Reveal><Kicker>FreshFlow의 답</Kicker></Reveal>
        <Reveal delay={60}><H2>모은다 → 알아챈다 → 먼저 움직인다</H2></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginTop: 8 }}>
          {[
            { n: "01", icon: "collect", t: "모은다", c: T.blue, d: "Port-MIS·UNI-PASS·KATI를 통합해 Port-to-FC 리드타임 5구간 중 ‘어디서 새는가’를 한눈에 알아 볼 수 있게 병목부분을 강조해 줍니다." },
            { n: "02", icon: "detect", t: "알아챈다", c: T.green, d: "평소 패턴(baseline) 이탈을 결품 발생 전에 감지해 경보. 시뮬레이션상 평균 7.4시간 선행 — 새벽에 깨지 않습니다." },
            { n: "03", icon: "act", t: "먼저 움직인다", c: T.accent, d: "선제배치·재고 이관·발주 시점 제안까지. 위험에서 끝내지 않고 ‘그래서 무엇을 누를지’를 제시합니다." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={120 + i * 90}>
              <div className="intro-card" style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: "30px 30px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <CardIcon kind={s.icon} color={s.c} />
                  <span style={{ fontFamily: T.mono, fontSize: 13, color: s.c }}>{s.n}</span>
                </div>
                <h3 style={{ fontFamily: T.display, fontWeight: 600, fontSize: "1.2rem", margin: "0 0 10px", color: T.ink }}>{s.t}</h3>
                <p style={{ fontFamily: T.body, fontSize: "1rem", lineHeight: 1.6, color: T.dim, margin: 0 }}>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 엔진 알고리즘 */}
      <Section divider>
        <Reveal><Kicker>엔진 · 어떻게 작동하나</Kicker></Reveal>
        <Reveal delay={60}><H2>감이 아니라, 계산으로</H2></Reveal>
        <Reveal delay={120}>
          <Lead style={{ maxWidth: 760 }}>
            모든 화면은 6개의 검증된 알고리즘 위에서 돌아갑니다. 블랙박스가 아니라, 누구나 따라 계산할 수 있는 투명한 규칙입니다.
          </Lead>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 8 }}>
          {[
            { tag: "01 · 리드타임", t: "Port-to-FC 리드타임 분해", d: "5개 구간(항만·통관·반출·내륙·FC)을 각각 정상 소요시간에 리스크를 반영해 계산·합산. 어느 구간이 얼마나 새는지 분해합니다.", f: "구간 = base × (1 + Σ 리스크 × 민감도)" },
            { tag: "02 · 결품 위험", t: "FC별 결품 위험 판정", d: "재고로 며칠 버티는지(커버리지)에서 리드타임을 빼 여유(gap)를 구하고 위험 등급을 매깁니다.", f: "gap = 재고/일수요 − 리드타임 · gap<0 → High" },
            { tag: "03 · 선제배치", t: "2단계 선제배치 최적화", d: "신규 선적을 부족분 비례로 위험 FC에 우선 배정하고, 그래도 모자라면 과재고 FC에서 이관합니다.", f: "① 부족분 비례 배정 → ② 과재고 이관" },
            { tag: "04 · 조기경보", t: "이상 신호 조기경보 (z-score)", d: "최근 관측이 평소 패턴 대비 z-score 임계를 넘고 추세가 상승하면 결품이 나기 전에 경보합니다.", f: "z > 1.8 & 추세↑ & 5틱 외삽 ≥ 임계×0.9" },
            { tag: "05 · 신선도", t: "상품가치 손실(신선도) 추정", d: "콜드체인 허용일을 넘긴 시간에 품목 민감도와 폭염 가속을 곱해 폐기 손실률을 누적합니다.", f: "손실 = perish × (6%/일 ×(1+폭염×1.5)) × 초과일" },
            { tag: "06 · 비용 임팩트", t: "Before/After 비용 환산", d: "결품 기회손실·재고폐기·이관 운송비를 선제조치 전/후로 환산해 순절감을 계산합니다.", f: "순절감 = (결품+폐기)전 − (결품+폐기+운송)후" },
          ].map((a, i) => (
            <Reveal key={a.tag} delay={120 + i * 70}>
              <div className="intro-card" style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: "24px 26px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.accent, marginBottom: 10 }}>{a.tag}</div>
                <h3 style={{ fontFamily: T.display, fontWeight: 600, fontSize: "1.12rem", margin: "0 0 10px", color: T.ink, letterSpacing: -0.3 }}>{a.t}</h3>
                <p style={{ fontFamily: T.body, fontSize: "0.98rem", lineHeight: 1.6, color: T.dim, margin: "0 0 14px" }}>{a.d}</p>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: "#4E5968", background: "#F2F4F6", border: `1px solid ${T.line}`, borderRadius: 8, padding: "9px 11px", lineHeight: 1.5 }}>{a.f}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={560}>
          <p style={{ fontFamily: T.body, fontSize: "0.95rem", color: T.dim, marginTop: 36, marginBottom: 0 }}>
            ※ 현재는 머신러닝이 아니라 <strong style={{ color: T.ink }}>리스크 기반 시나리오 계산</strong>입니다. 실데이터 확보 전까지 정확도를 과장하지 않는 정직한 접근이며, 데이터가 쌓이면 동일 인터페이스 위에서 ML 예측으로 고도화합니다.
          </p>
        </Reveal>
      </Section>

      {/* 검증 */}
      <Section divider>
        <Reveal><Kicker>작동하는 시스템 · 검증된 수치</Kicker></Reveal>
        <Reveal delay={60}><H2>추측이 아니라, 검증했다</H2></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 18, margin: "8px 0 28px" }}>
          {[
            { node: <CountUp value={7.4} decimals={1} suffix="h" />, l: "결품 전 평균 선행 (조기경보)" },
            { node: "2 → 0", l: "위기 시 결품 위험 FC (개)" },
            { node: <CountUp value={1.5} decimals={1} suffix="%" />, l: "조기경보 오작동률" },
            { node: <CountUp value={90} suffix="%" />, l: "위기·체리 1건 비용 순절감" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 90}>
              <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: "clamp(2.6rem,4vw,3.3rem)", color: T.ink, lineHeight: 1, letterSpacing: -1.5 }}>{s.node}</div>
              <div style={{ fontFamily: T.body, fontSize: "0.98rem", color: T.dim, marginTop: 10, lineHeight: 1.5 }}>{s.l}</div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={360}>
          <Lead style={{ marginBottom: 0, fontSize: "1.05rem", color: T.dim }}>
리스크가 점진적으로 악화되는 시나리오를 200회 반복 시뮬레이션해 조기경보가 결품 발생 전에 울리는지(평균 7.4시간 선행, 오경보 1.5%) 검증했고,
            위기 상황의 선제배치 전·후(BEFORE/AFTER)로 결품 위험 FC가 2개에서 0개로 해소되는 것을 확인했습니다.
          </Lead>
        </Reveal>
      </Section>

      {/* 비전 / 클로징 (다크 섹션) */}
      <Section dark>
        <Reveal><Kicker>시작은 뾰족하게, 확장은 크게</Kicker></Reveal>
        <Reveal delay={60}><H2 light>Ian은 한 명이 아니다</H2></Reveal>
        <Reveal delay={120}>
          <p style={{ fontFamily: T.body, fontSize: "1.2rem", lineHeight: 1.7, color: "#B0B8C1", maxWidth: 720, margin: "0 0 14px" }}>
            한국 수입 신선식품 바이어에서 시작해, 일반 수입품 → 아시아 콜드체인으로.
            모든 수입 유통사의 바이어가 매일 같은 도박을 합니다. 2030년 5,000억 달러 시장입니다.
          </p>
        </Reveal>
        <Reveal delay={180}>
          <p style={{ fontFamily: T.body, fontSize: "1.5rem", lineHeight: 1.5, color: T.paper, margin: "28px 0 28px" }}>
            FreshFlow는 Ian이 더 이상 도박하지 않게 한다. <span style={{ color: "#5AA0FF" }}>감이 아니라, 데이터로.</span>
          </p>
        </Reveal>
        <Reveal delay={240}>
          <button onClick={onLaunch} className="intro-cta" style={{
            fontFamily: T.display, fontWeight: 500, fontSize: 15, cursor: "pointer",
            background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: "13px 26px" }}>
            대시보드에서 직접 확인하기 →
          </button>
        </Reveal>
        <div style={{ fontFamily: T.display, fontSize: 13, color: "#8B95A1", marginTop: 36 }}>
          AI 해커톤 · Smart Logistics — Rocket_Ian_Lab
        </div>
      </Section>
    </div>
  );
}
