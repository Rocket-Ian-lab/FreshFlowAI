import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// FreshFlow AI — Vite + React 개발 환경
// FreshFlowAI.jsx(검증된 엔진)는 그대로 두고 Vite로만 감싼다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // AI 진단 요청(/api)을 Express 프록시(8787)로 중계
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
