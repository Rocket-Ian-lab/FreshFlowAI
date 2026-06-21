import React, { useState } from "react";
import Logo from "./Logo";
import RocketIanLab from "./RocketIanLab";
import FreshFlowAI from "./FreshFlowAI";
import Intro from "./Intro";

// 상단 내비게이션 + 뷰 전환 (대시보드 / 소개자료). Anthropic 스타일 슬림 바.
const N = { page: "#F2F4F6", ink: "#191F28", line: "#E5E8EB", dim: "#6B7684", accent: "#3182F6",
  display: "'Pretendard Variable', Pretendard, system-ui, -apple-system, sans-serif" };

export default function App() {
  const [view, setView] = useState("dashboard"); // dashboard | intro

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

  return (
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
          <Tab id="dashboard" label="대시보드" />
          <Tab id="intro" label="소개자료" />
        </div>
        <div style={{ marginLeft: "auto", transform: "scale(0.85)", transformOrigin: "right center" }}><RocketIanLab icon={34} /></div>
      </nav>

      {view === "dashboard" ? <FreshFlowAI /> : <Intro onLaunch={() => setView("dashboard")} />}
    </div>
  );
}
