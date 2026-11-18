import React, { useState, useEffect } from "react";
import Logo from "./Logo";
import RocketIanLab from "./RocketIanLab";
import FreshFlowAI from "./FreshFlowAI";
import Intro from "./Intro";
import { LangContext, initialLang, saveLang } from "./i18n.js";

// 상단 내비게이션 + 뷰 전환 (대시보드 / 소개자료) + 영한 전환. Anthropic 스타일 슬림 바.
const N = { page: "#F2F4F6", ink: "#191F28", line: "#E5E8EB", dim: "#6B7684", accent: "#3182F6",
  display: "'Pretendard Variable', Pretendard, system-ui, -apple-system, sans-serif" };

export default function App() {
  const [view, setView] = useState("dashboard"); // dashboard | intro
  const [lang, setLang] = useState(initialLang); // ko | en
  const en = lang === "en";

  useEffect(() => {
    saveLang(lang);
    document.documentElement.lang = lang;
    document.title = en ? "FreshFlow AI — Cold-chain Port-to-FC control tower" : "FreshFlow AI — 콜드체인 Port-to-FC 관제탑";
  }, [lang, en]);

  const Tab = ({ id, label }) => {
    const on = view === id;
    return (
      <button onClick={() => setView(id)} style={{
        border: "none", background: "transparent", cursor: "pointer", fontFamily: N.display,
        fontSize: 17, fontWeight: on ? 700 : 600, color: on ? N.ink : N.dim, letterSpacing: -0.3,
        padding: "8px 2px", borderBottom: `2.5px solid ${on ? N.accent : "transparent"}`,
      }}>{label}</button>
    );
  };

  const LangBtn = ({ id, label, title }) => {
    const on = lang === id;
    return (
      <button onClick={() => setLang(id)} aria-pressed={on} title={title} style={{
        border: "none", cursor: "pointer", fontFamily: N.display, fontSize: 13, fontWeight: 700,
        padding: "6px 12px", background: on ? N.ink : "transparent", color: on ? "#fff" : N.dim,
      }}>{label}</button>
    );
  };

  return (
    <LangContext.Provider value={lang}>
      <div style={{ minHeight: "100vh", background: N.page }}>
        <nav style={{
          position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)", borderBottom: `1px solid ${N.line}`,
          padding: "11px 30px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <Logo size={45} />
            <span style={{ fontFamily: "'Wanted Sans Variable', " + N.display, fontSize: 24, fontWeight: 700, color: N.ink, letterSpacing: -0.5 }}>
              FreshFlow <span style={{ color: N.accent }}>AI</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 22, marginLeft: 20 }}>
            <Tab id="dashboard" label={en ? "Dashboard" : "대시보드"} />
            <Tab id="intro" label={en ? "Overview" : "소개자료"} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 18 }}>
            <div role="group" aria-label={en ? "Language" : "언어"} style={{
              display: "inline-flex", border: `1px solid ${N.line}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
              <LangBtn id="ko" label="한국어" title="한국어로 보기" />
              <LangBtn id="en" label="EN" title="View in English" />
            </div>
            <div style={{ transform: "scale(0.85)", transformOrigin: "right center" }}><RocketIanLab icon={34} /></div>
          </div>
        </nav>

        {view === "dashboard" ? <FreshFlowAI /> : <Intro onLaunch={() => setView("dashboard")} />}
      </div>
    </LangContext.Provider>
  );
}
