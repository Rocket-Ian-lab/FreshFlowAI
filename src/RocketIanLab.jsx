import React from "react";

/* 개인 브랜드 CI — Rocket_Ian_Lab
   원형 다크 배지(로켓 + 점선 궤도) + 워드마크 + 태그라인. FreshFlow 제품 로고와 별개. */
export default function RocketIanLab({ icon = 54 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* 원형 로켓 배지 */}
      <svg width={icon} height={icon} viewBox="0 0 100 100" fill="none"
        xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rocket Ian Lab" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="rilRing" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#7b6ef0" />
            <stop offset="1" stopColor="#3fd0e6" />
          </linearGradient>
          <radialGradient id="rilDisk" cx="0.5" cy="0.42" r="0.65">
            <stop offset="0" stopColor="#1d1b36" />
            <stop offset="1" stopColor="#0c0a18" />
          </radialGradient>
          <linearGradient id="rilBody" x1="38" y1="22" x2="62" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8f7df2" />
            <stop offset="1" stopColor="#52d3e6" />
          </linearGradient>
          <linearGradient id="rilFlame" x1="50" y1="62" x2="50" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#bfeaf2" />
            <stop offset="1" stopColor="#5fd6e6" stopOpacity="0.2" />
          </linearGradient>
          <filter id="rilGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        {/* 외곽 링 + 디스크 */}
        <circle cx="50" cy="50" r="47" fill="url(#rilDisk)" stroke="url(#rilRing)" strokeWidth="2.6" />
        <circle cx="50" cy="50" r="41" stroke="#3a3760" strokeOpacity="0.4" strokeWidth="1" />

        {/* 점선 궤도 + 입자 */}
        <g transform="rotate(-25 50 52)">
          <ellipse cx="50" cy="52" rx="32" ry="13" stroke="#6b5fd6" strokeOpacity="0.5"
            strokeWidth="1.4" strokeDasharray="2 4" />
        </g>
        <circle cx="26" cy="62" r="1.4" fill="#5fd6e6" />
        <circle cx="31" cy="67" r="2"   fill="#7b6ef0" />
        <circle cx="37" cy="65" r="1.2" fill="#5fd6e6" />

        {/* 로켓 본체 */}
        <path d="M50 22 C44 26 40 34 40 44 L40 57 Q40 61 44 61 L56 61 Q60 61 60 57 L60 44 C60 34 56 26 50 22 Z"
          fill="url(#rilBody)" />
        {/* 핀 */}
        <path d="M40 49 L30 62 L40 59 Z" fill="#7b6ef0" />
        <path d="M60 49 L70 62 L60 59 Z" fill="#7b6ef0" />
        {/* 창 */}
        <circle cx="50" cy="41" r="6" fill="#6b5fd6" />
        <circle cx="50" cy="41" r="2.8" fill="#241f4a" />
        {/* 분사 화염 */}
        <path d="M44 61 L56 61 L50 77 Z" fill="url(#rilFlame)" filter="url(#rilGlow)" />
        <circle cx="47" cy="70" r="1.3" fill="#5fd6e6" />
        <circle cx="53" cy="72" r="1.5" fill="#7b6ef0" />
      </svg>

      {/* 워드마크 + 태그라인 (SVG 텍스트 — 그라데이션 fill) */}
      <svg width="232" height="46" viewBox="0 0 232 46" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-label="Rocket_Ian_Lab" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="rilIan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#6b5fe0" />
            <stop offset="1" stopColor="#2f9fd0" />
          </linearGradient>
        </defs>
        <text x="0" y="22" fontFamily="'IBM Plex Sans', system-ui, sans-serif"
          fontSize="24" fontWeight="800" letterSpacing="0.3">
          <tspan fill="#3D4368">Rocket</tspan>
          <tspan fill="#7A5AF8">_</tspan>
          <tspan fill="url(#rilIan)">Ian</tspan>
          <tspan fill="#7A5AF8">_</tspan>
          <tspan fill="#3D4368">Lab</tspan>
        </text>
        <text x="1" y="41" fontFamily="'IBM Plex Sans', system-ui, sans-serif" fontSize="12" fill="#6B7385">
          {"> experiments in data, logistics & AI"}
        </text>
      </svg>
    </div>
  );
}
