import Link from "next/link";
import { Mic, Sparkles, Play, Moon } from "@/components/Icon";

const features = [
  {
    Icon: Mic,
    title: "내 목소리 만들기",
    desc: "30초만 녹음하면 엄마 아빠 목소리를 AI가 똑같이 배워요.",
    tone: "primary" as const,
  },
  {
    Icon: Sparkles,
    title: "AI 동화 만들기",
    desc: "줄거리만 알려주면 우리 아이가 주인공인 동화를 만들어줘요.",
    tone: "secondary" as const,
  },
  {
    Icon: Play,
    title: "내 목소리로 들려주기",
    desc: "전래동화부터 영어동화까지, 부모님 목소리로 읽어줘요.",
    tone: "accent" as const,
  },
  {
    Icon: Moon,
    title: "잠자기 타이머",
    desc: "정한 시간이 지나면 저절로 멈춰요. 잠자리 동화에 딱이에요.",
    tone: "neutral" as const,
  },
];

const steps = [
  { step: "01", title: "목소리 녹음", desc: "짧은 문장 몇 개를 또박또박 읽어주세요. 1분이면 충분해요." },
  { step: "02", title: "동화 고르기", desc: "전래동화·세계명작·영어동화, AI가 만든 동화까지 마음껏 골라요." },
  { step: "03", title: "들려주기", desc: "엄마 아빠 목소리로 동화가 시작돼요. 곁에 없어도 늘 함께예요." },
];

const testimonials = [
  {
    quote:
      "제 목소리로 동화를 들려주니 아이 잠투정이 확 줄었어요. 출장 가서도 매일 밤 한 편씩 들려줄 수 있어 좋아요.",
    who: "5살 아이 엄마",
  },
  {
    quote:
      "녹음은 1분이면 끝나는데, 이제 아이가 매일 '아빠가 읽어주는 책'을 먼저 찾아요.",
    who: "6살 아이 아빠",
  },
  {
    quote:
      "멀리 계신 할머니 목소리로도 만들어 드렸더니 온 가족이 정말 좋아했어요.",
    who: "4살 아이 엄마",
  },
];

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 320 250"
      className="w-full h-auto"
      role="img"
      aria-label="달빛 아래 펼쳐진 동화책"
    >
      <circle cx="160" cy="128" r="116" fill="#F8EFDD" />
      <circle cx="160" cy="128" r="84" fill="#F7ECE5" />

      {/* 별 */}
      <g fill="#C9974A">
        <path d="M58 52 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" />
        <path d="M256 152 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
        <circle cx="92" cy="156" r="3.5" />
        <circle cx="150" cy="32" r="3" />
        <circle cx="230" cy="98" r="2.5" />
      </g>

      {/* 달 */}
      <circle cx="244" cy="56" r="25" fill="#C9974A" />
      <circle cx="238" cy="48" r="6" fill="#fff" opacity="0.3" />
      <circle cx="252" cy="63" r="4" fill="#fff" opacity="0.25" />
      <circle cx="236" cy="66" r="3" fill="#fff" opacity="0.25" />

      {/* 책 표지 */}
      <path
        d="M160 96 C132 85 98 85 68 97 L68 185 C98 173 132 173 160 184 C188 173 222 173 252 185 L252 97 C222 85 188 85 160 96 Z"
        fill="#B85339"
      />
      {/* 왼쪽 페이지 */}
      <path
        d="M160 102 C137 92 107 92 80 102 L80 176 C107 166 137 166 160 176 Z"
        fill="#fff"
        stroke="#E8E0D5"
        strokeWidth="2"
      />
      {/* 오른쪽 페이지 */}
      <path
        d="M160 102 C183 92 213 92 240 102 L240 176 C213 166 183 166 160 176 Z"
        fill="#fff"
        stroke="#E8E0D5"
        strokeWidth="2"
      />
      {/* 글줄 */}
      <g stroke="#DCD2C4" strokeWidth="3" strokeLinecap="round">
        <path d="M96 118 H140" />
        <path d="M96 132 H146" />
        <path d="M96 146 H132" />
        <path d="M180 118 H224" />
        <path d="M174 132 H224" />
        <path d="M188 146 H224" />
      </g>

      {/* 음표 */}
      <g fill="#B85339">
        <circle cx="148" cy="80" r="6" />
        <rect x="153" y="58" width="3.4" height="24" rx="1.7" />
      </g>
      <g fill="#4A3F6B">
        <circle cx="196" cy="66" r="5" />
        <rect x="200" y="48" width="3" height="20" rx="1.5" />
      </g>
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="leading-tight">
            <p className="text-[9px] uppercase tracking-[0.22em] text-muted font-semibold">
              MyVoiceStory
            </p>
            <p className="text-[17px] font-extrabold text-primary tracking-tight">
              마이보이스스토리
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login?next=/"
              className="px-4 py-2 rounded-full text-sm font-semibold text-foreground/80 hover:bg-surface-soft transition"
            >
              로그인
            </Link>
            <Link
              href="/login?mode=signup&next=/"
              className="px-4 py-2 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary-dark transition shadow-sm shadow-primary/20"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero-warm relative overflow-hidden">
        {/* 장식 */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <span
            className="lp-twinkle absolute w-2 h-2 rounded-full bg-accent"
            style={{ top: "14%", left: "9%" }}
          />
          <span
            className="lp-twinkle absolute w-1.5 h-1.5 rounded-full bg-primary/40"
            style={{ top: "26%", left: "18%", animationDelay: "0.6s" }}
          />
          <span
            className="lp-twinkle absolute w-2 h-2 rounded-full bg-accent"
            style={{ top: "20%", right: "14%", animationDelay: "1s" }}
          />
          <span
            className="lp-twinkle absolute w-1.5 h-1.5 rounded-full bg-secondary/40"
            style={{ top: "52%", right: "10%", animationDelay: "1.6s" }}
          />
          <span
            className="lp-twinkle absolute w-1.5 h-1.5 rounded-full bg-primary/40"
            style={{ top: "62%", left: "7%", animationDelay: "2.2s" }}
          />

          {/* 종이비행기 왼쪽 */}
          <svg
            className="lp-sway absolute w-16 h-16"
            style={{ top: "24%", left: "5%" }}
            viewBox="0 0 100 100"
            fill="none"
            stroke="#B85339"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 50 L90 20 L60 80 L50 55 L10 50 Z" />
            <path d="M50 55 L90 20" />
          </svg>

          {/* 종이비행기 오른쪽 */}
          <svg
            className="lp-float absolute w-20 h-14"
            style={{ top: "12%", right: "6%", animationDelay: "1s" }}
            viewBox="0 0 200 120"
            fill="none"
            stroke="#4A3F6B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M80 40 L180 15 L150 85 L130 55 L80 40 Z" />
            <path d="M130 55 L180 15" />
            <path d="M10 80 Q 40 60, 70 70 T 130 60" strokeDasharray="4 7" />
          </svg>

          {/* 열기구 */}
          <svg
            className="lp-float absolute w-14 h-20"
            style={{ top: "44%", right: "9%", animationDelay: "0.4s" }}
            viewBox="0 0 80 110"
          >
            <ellipse cx="40" cy="40" rx="32" ry="38" fill="#C9974A" />
            <path
              d="M22 8 Q 22 50, 30 78"
              stroke="#B85339"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M58 8 Q 58 50, 50 78"
              stroke="#B85339"
              strokeWidth="3"
              fill="none"
            />
            <line x1="30" y1="78" x2="34" y2="92" stroke="#8A7E72" strokeWidth="1.5" />
            <line x1="50" y1="78" x2="46" y2="92" stroke="#8A7E72" strokeWidth="1.5" />
            <rect x="32" y="92" width="16" height="12" rx="3" fill="#4A3F6B" />
          </svg>
        </div>

        <div className="max-w-3xl mx-auto px-6 pt-14 pb-20 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-surface border border-border text-foreground/80 text-[11px] font-semibold tracking-wider px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            엄마·아빠 목소리로 듣는 AI 동화
          </span>
          <h1 className="text-[clamp(28px,6vw,46px)] font-extrabold leading-[1.18] tracking-tight mb-4">
            우리 아이가 가장 사랑하는 목소리로,
            <br />
            <span className="text-primary">매일 밤 동화 한 편</span>
          </h1>
          <p className="text-foreground/70 text-[15px] sm:text-base mb-8 leading-relaxed max-w-md mx-auto">
            엄마·아빠 목소리를 1분만 녹음하면, AI가 그 목소리 그대로
            동화를 읽어줘요. 곁에 없는 날에도 늘 함께예요.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-3">
            <Link
              href="/login?mode=signup&next=/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full text-[15px] font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
            >
              무료로 시작하기
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/login?next=/"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-surface border border-border text-foreground px-8 py-3.5 rounded-full text-[15px] font-bold hover:border-border-strong transition"
            >
              로그인
            </Link>
          </div>
          <p className="text-[11px] text-muted mb-12">
            이메일로 30초면 가입할 수 있어요
          </p>

          <div className="max-w-[420px] mx-auto">
            <HeroIllustration />
          </div>
        </div>

        <svg
          className="absolute inset-x-0 -bottom-px w-full text-background"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 40V20Q100 0 200 20T400 20V40z" fill="currentColor" />
        </svg>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted font-semibold mb-2">
          Features
        </p>
        <h2 className="text-center text-[26px] font-extrabold mb-10 tracking-tight">
          이런 게 가능해요
        </h2>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {features.map((feat) => {
            const toneClass =
              feat.tone === "primary"
                ? "bg-primary-light text-primary"
                : feat.tone === "secondary"
                ? "bg-secondary-light text-secondary"
                : feat.tone === "accent"
                ? "bg-accent-light text-accent"
                : "bg-surface-soft text-foreground";
            return (
              <div key={feat.title} className="card p-5 flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${toneClass}`}
                >
                  <feat.Icon size={22} filled />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[15px] mb-1">{feat.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 bg-surface border-y border-border">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted font-semibold mb-2">
            How it works
          </p>
          <h2 className="text-center text-[26px] font-extrabold mb-10 tracking-tight">
            3단계로 끝나요
          </h2>
          <div className="relative">
            <div
              className="absolute left-6 top-3 bottom-3 w-px bg-border"
              aria-hidden
            />
            <div className="flex flex-col gap-7">
              {steps.map((item) => (
                <div key={item.step} className="flex items-start gap-5 relative">
                  <div className="relative z-10 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-extrabold tracking-wider flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="pt-1.5">
                    <h3 className="font-bold text-[15px] mb-0.5">{item.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted font-semibold mb-2">
          Voices
        </p>
        <h2 className="text-center text-[26px] font-extrabold mb-10 tracking-tight">
          부모님들의 이야기
        </h2>
        <div className="grid gap-3.5 sm:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.who} className="card p-5 flex flex-col">
              <div className="text-accent text-sm mb-3 tracking-wider">
                ★★★★★
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1">
                “{t.quote}”
              </p>
              <p className="text-xs text-muted font-semibold mt-4">{t.who}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-hero-warm px-6 py-16 text-center">
        <h2 className="text-[26px] font-extrabold mb-3 tracking-tight">
          오늘 밤, 한 편 들려줄까요?
        </h2>
        <p className="text-sm text-muted mb-7 leading-relaxed">
          지금 가입하면 바로 우리 아이만의 동화를 시작할 수 있어요.
        </p>
        <Link
          href="/login?mode=signup&next=/"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full text-[15px] font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
        >
          무료로 시작하기
          <span aria-hidden>→</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-surface-soft px-6 py-10 text-center border-t border-border">
        <p className="text-lg font-extrabold text-primary tracking-tight mb-1">
          마이보이스스토리
          <span className="text-foreground/60 font-bold"> for kids</span>
        </p>
        <p className="text-xs text-muted mb-3">
          엄마 아빠 목소리로 들려주는 우리 아이 동화
        </p>
        <p className="text-[11px] text-muted/80 tracking-wide">
          서강대학교 · 생성형 AI의 이해와 활용 9조 프로젝트
        </p>
        <p className="text-[11px] text-muted/80 tracking-wide mt-1">
          © 2026 MyVoiceStory for kids
        </p>
      </footer>
    </div>
  );
}
