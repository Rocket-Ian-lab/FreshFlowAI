# FreshFlow AI

> 콜드체인 **Port-to-FC 관제탑** — 수입식품 유통사 SCM 담당자를 위한 입고 예측·재고 밸런싱 도구.
> "선박이 언제 도착하는가"가 아니라 **"언제 FC에 입고되어 판매 가능한 재고가 되는가"**.

### 🔗 라이브 데모 → **[fresh-flow-ai.vercel.app](https://fresh-flow-ai.vercel.app/)**

분절된 공공데이터(Port-MIS · UNI-PASS · 식약처 수입식품 검사 정보)를 통합해 Port-to-FC 리드타임을 예측하고,
FC별 결품 위험을 진단해 선제배치·이관·발주 시점을 제안하는 React 대시보드입니다.

## 주요 기능
- **⓪ 화물 조회(BL)** — UNI-PASS식 통관 진행 추적, 가상 BL로 시연
- **① 리스크 입력 / ② 리드타임 분해** — "어디서 새는가" + 이상치 하이라이트 + 신선도 손실 위험
- **②-B 조기경보(z-score)** — 합성 시계열 200회에서 임계 도달 평균 7.4시간 전 경보
- **③ 결품 위험 / ④ AI Copilot(요나)** — Claude 기반 자연어 진단(+규칙기반 폴백)
- **⑤ 선제 조치(Prescriptive)** — 신규 선적 도착 전 공백을 센터 간 긴급 이관으로 메우는 시간축 검증 + 모의 실행
- **⑥ 비용 임팩트** — Before/After ₩ 환산 (가정 기반 비용모델, 위기 시나리오 예상손실 79~88% 감소)
- **소개자료** 탭 — 제품 스토리 에디토리얼

## 기술 스택
- React + Vite, 인라인 스타일 토큰(테마 교체 용이), Pretendard 폰트
- AI: Claude API (`claude-sonnet-4-6`) — 프록시 경유 (`/api/messages`)

## 로컬 실행
```bash
npm install
cp .env.example .env   # ANTHROPIC_API_KEY (AI) · DATA_GO_KR_KEY (기상청) · UNIPASS_KEY (통관) — 모두 선택, 없으면 폴백
npm run dev            # Vite(5173) + 프록시(8787) 동시 실행
```
키가 없어도 규칙기반 진단은 항상 동작하므로 데모는 멈추지 않습니다.

## 배포 (Vercel)
1. 이 레포를 [Vercel](https://vercel.com)에서 **Import** (Framework: Vite 자동 감지)
2. **Environment Variables**에 `ANTHROPIC_API_KEY` 추가 — 실시간 데이터까지 쓰려면 `DATA_GO_KR_KEY`(공공데이터포털: 기상청 단기예보·기상특보 활용신청)와 `UNIPASS_KEY`(관세청 UNI-PASS 인증키)도 추가. 없으면 해당 소스는 "키 미설정"으로 표시되고 시뮬레이션 값을 유지
3. Deploy — 정적 빌드는 `dist`, `/api/messages`는 서버리스 함수(`api/messages.js`)로 동작

> 🔒 API 키는 `.env`(gitignore)와 Vercel 환경변수에만 존재하며 레포·번들에 포함되지 않습니다.

## 로직 검증
```bash
node test_freshness.mjs    # 신선도 손실
node test_costimpact.mjs   # 비용 임팩트(정적 모델)
node test_bridge.mjs       # 입고 전 공백 시간축 검증(긴급 이관)
node test_earlywarn.mjs    # 조기경보 재현 실험(시드 고정)
node test_liveadapter.mjs  # 기상청·UNI-PASS 어댑터(실제 응답 형태 회귀 포함)
```

---
AI 해커톤 · Smart Logistics — Rocket_Ian_Lab
