# 마이보이스스토리 for 키즈 🌙

> 보호자의 목소리를 복제해 아이에게 동화를 들려주는 AI 동화 서비스
> 서강대학교 AI SW 대학원 · 「생성형 AI의 이해와 활용」 9조 POC

**라이브:** https://logpxai.co.kr

부모·보호자가 30초만 녹음하면 AI가 그 목소리를 복제하고, 동화를 **엄마·아빠 목소리**로 읽어줍니다. 줄거리 한 줄만 입력하면 우리 아이만을 위한 동화도 AI가 만들어 줍니다.

---

## ✨ 주요 기능

- **AI 동화 만들기** — 줄거리·아이 이름·나이를 입력하면 Gemini가 동화 한 편 생성 (부적절 키워드 차단, 후속편 모드 지원)
- **목소리 복제** — 안내 문장 녹음(30초+) → ElevenLabs로 음성 복제 → 계정에 저장. 기본 목소리 4종도 제공
- **동화 듣기** — ElevenLabs TTS로 재생, 목소리 선택, 배속·15초 이동·문단 하이라이트, **잠자기 타이머(15/30/60분)**와 밤 테마
- **동화 책장(홈)** — 기본 동화 **34편**(영어·전래·세계명작·잠자리·모험·자연) · 카테고리/연령 필터 · 검색 · 오늘의 추천 · 인기/새로 온 동화
- **이어 듣기 & 듣기 캘린더** — 듣다 만 동화 이어서, 들은 날짜를 달력으로 기록
- **내 서재** — 내 목소리 관리, 저장한 동화(북마크), 내가 만든 동화

반응형: 모바일(<1024px) 하단 탭바 · 데스크탑(≥1024px) 좌측 사이드바.

---

## 🛠 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트·서버 | Next.js 16.2.2 (App Router, webpack) · React 19.2 · TypeScript |
| 스타일 | Tailwind CSS v4 |
| DB | MySQL 8 (`mysql2`) |
| 인증 | bcryptjs · jose (JWT httpOnly 쿠키 `mvk_session`, 30일) |
| 음성 | ElevenLabs — Voice Cloning + TTS (`eleven_multilingual_v2`), `audio_cache`로 합성 결과 캐싱 |
| 동화 생성 | Google Gemini (`gemini-2.5-flash` → 보조 `gemini-2.5-flash-lite`) |
| 배포 | 로컬 프로덕션 서버(3001) + Cloudflare Tunnel(`cloudflared`) |

> 사내 보안정책상 Turbopack 네이티브 바인딩이 차단되어 **webpack**으로 실행/빌드합니다 (`next dev --webpack`, `next build --webpack`).

---

## 🚀 시작하기

### 1. 환경 변수 (`.env.local`)

```env
DATABASE_URL=mysql://user:pass@localhost:3306/myvoicekids
SESSION_SECRET=<임의의 긴 문자열>
GEMINI_API_KEY=<Google Gemini 키>
ELEVENLABS_API_KEY=<ElevenLabs 키>
OPENAI_API_KEY=<선택>
```

### 2. DB 초기화

```bash
npm run db:setup   # 테이블 생성
npm run db:seed    # 기본 동화 시드
```

### 3. 개발 서버

```bash
npm run dev        # http://localhost:3000 (webpack)
```

---

## 📦 배포

**⚠️ git push로 자동 배포되지 않습니다.** 프로덕션은 이 PC에서 빌드 결과물을 띄우므로, 코드 반영 시 재빌드가 필요합니다.

```bash
npm run build              # webpack 프로덕션 빌드
npx next start -p 3001     # 3001 프로덕션 서버 (Cloudflare Tunnel이 연결)
```

- `logpxai.co.kr` → Cloudflare → cloudflared 터널(`myvoicekids`) → `localhost:3001`
- 자세한 내용은 [`도메인-배포-설정.md`](./도메인-배포-설정.md) 참고

---

## 📜 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (3000, webpack) |
| `npm run build` | 프로덕션 빌드 (webpack) |
| `npm start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint |
| `npm run db:setup` | DB 테이블 생성 |
| `npm run db:seed` | 기본 동화 시드 |

---

## 📚 문서

- [`기능명세.md`](./기능명세.md) — 화면·기능·API·DB 상세 명세
- [`도메인-배포-설정.md`](./도메인-배포-설정.md) — 도메인 연결·자동 실행·운영 방법
- [`발표자료_초안.md`](./발표자료_초안.md) — 발표 자료

---

<sub>서강대학교 AI SW 대학원 · 「생성형 AI의 이해와 활용」 9조</sub>
