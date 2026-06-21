# Anthropic 스타일 디자인 가이드 (for Claude Code)

> 이 문서는 Claude Code가 웹/UI 작업 시 **anthropic.com의 디자인 언어**를 따르도록 하는 지침이다.
> 프로젝트 루트에 두면 Claude Code가 읽고 적용한다. 모든 색·폰트·간격 결정은 이 문서에서 파생한다.
>
> 출처: Anthropic 공식 brand-guidelines + anthropic.com 실측. 디자인 철학은 **"Warm, trustworthy, thoughtfully restrained"** (따뜻하고, 신뢰감 있고, 절제된).

---

## 0. 디자인 철학 — 3원칙

anthropic.com을 특징짓는 것은 화려함이 아니라 **절제**다. Claude Code는 이 셋을 항상 지킨다:

1. **Warmth (따뜻함)** — 차가운 순백/순흑이 아니라 **크림빛 오프화이트(#faf9f5)와 잉크빛 다크(#141413)**. 종이 같은 따뜻함. 테크 제품의 흔한 차가운 블루-그레이를 피한다.
2. **Restraint (절제)** — 액센트(오렌지)는 아주 드물게. 페이지 대부분은 오프화이트 배경 + 다크 텍스트. 강조는 한 곳에만. 그라데이션·그림자·애니메이션 남발 금지.
3. **Editorial (편집 디자인)** — 잡지/논문 같은 **넉넉한 여백 + 큰 타이포 + 세리프 본문**. 빽빽한 SaaS 대시보드가 아니라, 읽히는 글처럼.

> 한 줄 원칙: **종이처럼 따뜻하고, 논문처럼 차분하며, 강조는 단 한 번.**

---

## 1. 색상 (Colors) — 공식 토큰

### 1.1 기본 색

```css
:root{
  /* 베이스 */
  --ink:        #141413;  /* 기본 텍스트, 다크 배경 (순흑 아님 — 잉크빛) */
  --paper:      #faf9f5;  /* 기본 배경 (순백 아님 — 크림빛 오프화이트) */
  --mid-gray:   #b0aea5;  /* 보조 요소, 비활성 */
  --light-gray: #e8e6dc;  /* 미묘한 배경, 구분선, 카드 */

  /* 액센트 (드물게) */
  --accent:     #d97757;  /* 주 액센트 — 따뜻한 테라코타 오렌지. CTA·강조에만 */
  --blue:       #6a9bcc;  /* 보조 액센트 */
  --green:      #788c5d;  /* 3차 액센트 */
}
```

### 1.2 색 사용 규칙 (중요)

- **배경은 거의 항상 `--paper`(#faf9f5).** 순백(#fff) 쓰지 않는다. 다크 섹션에만 `--ink`.
- **텍스트는 `--ink`(#141413).** 순흑(#000) 쓰지 않는다.
- **오렌지(`--accent`)는 페이지당 한두 번.** 주요 CTA, 핵심 링크 hover, 단 하나의 강조. 남용하면 Anthropic 느낌이 사라진다.
- **blue/green은 더 드물게** — 카테고리 구분이나 보조 그래픽에만.
- 위계는 **색이 아니라 크기·여백·굵기**로 만든다. (색을 아끼는 게 핵심)

### 1.3 다크 섹션
배경 `--ink` + 텍스트 `--paper`. 반전만 할 뿐 색 규칙은 동일하게 절제.

---

## 2. 타이포그래피 (Typography)

### 2.1 폰트 (실제 Anthropic 사용)

| 역할 | Anthropic 정품 | 웹 폴백 (라이선스 무료) | 최종 폴백 |
|---|---|---|---|
| **Display/Heading** | Styrene A | **Poppins** 또는 Inter | Arial, sans-serif |
| **Body** | Tiempos | **Lora** 또는 Source Serif 4 | Georgia, serif |

> Styrene/Tiempos는 유료 폰트라 프로젝트에 없을 수 있다. **Claude Code는 폴백을 쓴다**: 헤딩=Poppins, 본문=Lora. 둘 다 Google Fonts 무료. 핵심은 **"산세리프 헤딩 + 세리프 본문"** 조합 — 이게 Anthropic의 편집 디자인 느낌의 핵심이다.

```css
--font-display: 'Poppins', 'Inter', Arial, sans-serif;   /* 헤딩 */
--font-body:    'Lora', 'Source Serif 4', Georgia, serif; /* 본문 */
```

```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Lora:wght@400;500&display=swap" rel="stylesheet">
```

### 2.2 핵심 규칙 — 세리프 본문

**본문에 세리프(Lora/Tiempos)를 쓰는 게 Anthropic 스타일의 가장 큰 특징이다.** 대부분의 테크 사이트가 산세리프 본문을 쓰는 것과 정반대. 이 하나가 "읽히는 글" 느낌을 만든다. 절대 본문을 산세리프로 바꾸지 말 것.

### 2.3 타입 스케일 (편집 디자인 = 큰 헤드라인)

| 레벨 | 크기 | 폰트 | 비고 |
|---|---|---|---|
| Hero | `3.5–4.5rem` / 500 | display | 매우 크게. 페이지의 thesis. |
| H1 | `2.5rem` / 500 | display | |
| H2 | `1.75rem` / 500 | display | |
| H3 | `1.25rem` / 500 | display | |
| Body | `1.125rem` / 400 | **body(serif)** | 줄간격 1.6. 읽기 편하게 약간 크게. |
| Small | `0.875rem` / 400 | body 또는 display | 캡션·메타 |

- 헤딩 굵기는 **500(medium) 중심.** 700 bold는 드물게. 얇은 무게가 세련됨.
- 헤드라인은 과감하게 크게. 작고 빽빽한 제목은 Anthropic답지 않다.

---

## 3. 레이아웃 & 여백 (Layout)

### 3.1 여백이 디자인이다

Anthropic의 핵심은 **넉넉한 화이트스페이스**. 빽빽하게 채우지 않는다.

- 콘텐츠 최대폭: `--max-width: 1200px` (텍스트 중심 섹션은 `720px`로 더 좁게 — 읽기 편하게).
- 섹션 상하 패딩: `96px~128px` (넉넉하게).
- 요소 간 간격: 8px 스케일 (`8·16·24·32·48·64·96·128`).

### 3.2 구조

- **좌측 정렬 기본.** 중앙 정렬은 히어로·짧은 문구에만.
- 큰 헤드라인 + 그 아래 세리프 본문 한 문단 = 기본 블록.
- 카드는 `--light-gray` 배경 또는 얇은 보더(`1px solid --light-gray`).
- **라운드는 절제** — `8~12px` 정도. 과한 둥글기 X.

### 3.3 보더·그림자

- 그림자는 거의 안 쓴다. 쓰더라도 아주 미묘하게.
- 구분은 그림자가 아니라 **여백과 얇은 hairline 보더**로.

---

## 4. 컴포넌트 (Components)

### 4.1 버튼
- **Primary**: 배경 `--ink`, 텍스트 `--paper`. 또는 액센트가 필요한 단 하나의 CTA에 `--accent`.
- **Secondary**: 투명 배경 + `1px solid --ink` 보더.
- 라운드 `6~8px`, 패딩 `12px 24px`, display 폰트 medium.
- hover는 미묘하게 (배경 살짝 어둡게/밝게). 화려한 전환 X.

### 4.2 링크
- 기본 `--ink` + 밑줄, 또는 hover 시 `--accent`.
- 본문 내 링크는 밑줄로 구분.

### 4.3 카드 / 리스트 (anthropic.com "Latest releases" 스타일)
- 날짜·카테고리를 작은 메타 라벨로 (mid-gray).
- 제목은 display medium, 그 아래 세리프 한 줄 설명.
- "Read announcement →" 식의 텍스트 링크.
- 카드 간 넉넉한 여백.

### 4.4 네비게이션
- 상단 얇은 바, `--paper` 배경, 텍스트 `--ink`.
- 로고 좌측, 메뉴 우측. 미니멀.

---

## 5. 모션 (Motion)

절제가 핵심. **거의 움직이지 않는 게 Anthropic답다.**
- 등장: 부드러운 fade/up, `0.4~0.6s ease`. 한 번에 과하게 X.
- hover: 색·투명도 미묘한 변화만.
- 스크롤 시 섹션이 조용히 페이드인되는 정도.
- `prefers-reduced-motion` 존중.

---

## 6. 보이스 & 카피 (Voice)

anthropic.com의 카피는 **차분하고 명료**하다.
- 짧고 단정한 문장. 과장·마케팅 허풍 X.
- "AI research and products that put safety at the frontier" 같은 절제된 선언형.
- 기술을 자랑하지 않고, 가치·신뢰를 말한다.
- sentence case 기본 (제목도 과한 Title Case 지양).

---

## 7. Claude Code 적용 체크리스트

웹/UI 작업 시 확인:
- [ ] 배경이 `#faf9f5`(크림 오프화이트)인가? (순백 #fff 아님)
- [ ] 텍스트가 `#141413`(잉크)인가? (순흑 #000 아님)
- [ ] **본문이 세리프(Lora/Tiempos)**인가? (이게 핵심)
- [ ] 헤딩이 산세리프(Poppins/Styrene)인가?
- [ ] 오렌지 액센트(`#d97757`)를 페이지당 한두 번만 썼는가?
- [ ] 여백이 넉넉한가? (섹션 패딩 96px+)
- [ ] 헤드라인이 충분히 큰가? (Hero 3.5rem+)
- [ ] 그림자·라운드·애니메이션이 절제됐는가?
- [ ] 위계를 색이 아니라 크기·여백으로 만들었는가?
- [ ] 카피가 차분하고 과장 없는가?

---

## 8. 복붙용 베이스 CSS

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Lora:wght@400;500&display=swap');

:root{
  --ink:#141413; --paper:#faf9f5; --mid-gray:#b0aea5; --light-gray:#e8e6dc;
  --accent:#d97757; --blue:#6a9bcc; --green:#788c5d;
  --font-display:'Poppins','Inter',Arial,sans-serif;
  --font-body:'Lora','Source Serif 4',Georgia,serif;
  --max-width:1200px;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{
  background:var(--paper); color:var(--ink);
  font-family:var(--font-body); font-size:1.125rem; line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3,h4{font-family:var(--font-display); font-weight:500; line-height:1.15;}
h1{font-size:clamp(2.5rem,5vw,4rem);}
h2{font-size:1.75rem;}
.container{max-width:var(--max-width); margin:0 auto; padding:0 24px;}
.section{padding:96px 0;}
.prose{max-width:720px;}  /* 읽기 중심 영역은 더 좁게 */
a{color:var(--ink); text-decoration:underline; text-underline-offset:3px;}
a:hover{color:var(--accent);}
.btn{
  display:inline-block; font-family:var(--font-display); font-weight:500;
  background:var(--ink); color:var(--paper); padding:12px 24px;
  border-radius:8px; text-decoration:none; transition:opacity .3s ease;
}
.btn:hover{opacity:.88; color:var(--paper);}
.btn-secondary{background:transparent; color:var(--ink); border:1px solid var(--ink);}
.meta{font-family:var(--font-display); font-size:.875rem; color:var(--mid-gray);}
.card{background:var(--paper); border:1px solid var(--light-gray); border-radius:12px; padding:32px;}
@media (prefers-reduced-motion:reduce){*{animation:none!important; transition:none!important;}}
```

---

## 9. 흔한 실수 (피할 것)

- ❌ 순백 배경(#fff) → ✅ 크림 오프화이트(#faf9f5)
- ❌ 산세리프 본문 → ✅ 세리프 본문(Lora)
- ❌ 오렌지를 여기저기 → ✅ 페이지당 한두 번
- ❌ 빽빽한 레이아웃 → ✅ 넉넉한 여백
- ❌ 화려한 그라데이션·그림자 → ✅ 평면적이고 차분하게
- ❌ 작은 헤드라인 → ✅ 과감하게 큰 Hero
- ❌ 마케팅 허풍 카피 → ✅ 차분한 선언형
```

> 핵심 한 줄: **"본문 세리프 + 크림 배경 + 오렌지는 단 한 번 + 넉넉한 여백."** 이 넷만 지켜도 Anthropic 느낌의 80%가 나온다.
