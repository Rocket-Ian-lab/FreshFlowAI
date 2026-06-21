import React from "react";

/* FreshFlow CI 로고
   모티프: 어두운 스퀘어 위, 출발(blue) → 경유 → 도착(teal, glow)로 이어지는 경로.
   = Port → 통관 → FC로 이어지는 리드타임 구간/노드 연결을 형상화. */
export default function Logo({ size = 40, rounded = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FreshFlow 로고">
      <defs>
        <linearGradient id="ffBg" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16294a" />
          <stop offset="1" stopColor="#0a1322" />
        </linearGradient>
        <linearGradient id="ffRoute" x1="27" y1="71" x2="73" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f7bb0" />
          <stop offset="0.55" stopColor="#1fb6a6" />
          <stop offset="1" stopColor="#16e6c6" />
        </linearGradient>
        <filter id="ffGlow" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 배경 스퀘어 */}
      <rect x="2" y="2" width="96" height="96" rx={rounded ? 24 : 0}
        fill="url(#ffBg)" stroke="#223b60" strokeOpacity="0.6" strokeWidth="1" />

      {/* 경로 */}
      <path d="M27 71 C40 62 45 58 50 51 C56 43 62 38 73 29"
        stroke="url(#ffRoute)" strokeWidth="5" strokeLinecap="round" />

      {/* 경유 노드 */}
      <circle cx="50" cy="51" r="3.4" fill="#1f9fb0" />

      {/* 출발 노드 (blue ring) */}
      <circle cx="27" cy="71" r="5.2" fill="#0b1830" stroke="#4f7bb0" strokeWidth="3" />

      {/* 도착 노드 (teal, glow) */}
      <g filter="url(#ffGlow)">
        <circle cx="73" cy="29" r="6.4" fill="#0b1830" stroke="#16e6c6" strokeWidth="3.4" />
        <circle cx="73" cy="29" r="2" fill="#8dfbe8" />
      </g>
    </svg>
  );
}
