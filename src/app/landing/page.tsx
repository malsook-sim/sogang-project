import Link from "next/link";
import { Mic, Sparkles, Play, Moon } from "@/components/Icon";
import { HeroSampleButton } from "@/components/HeroSampleButton";
import { VoiceAvatar } from "@/components/VoiceAvatar";
import { Reveal } from "@/components/Reveal";

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

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/60">
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
      <section className="bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 lg:grid lg:grid-cols-[55%_45%] lg:gap-10 lg:items-center">
          {/* 좌: 카피 */}
          <div className="text-center lg:text-left mb-14 lg:mb-0">
            <span className="inline-flex items-center gap-1.5 bg-surface border border-border text-foreground/80 text-[11px] font-semibold tracking-wider px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4C566]" />
              엄마·아빠 목소리로 듣는 AI 동화
            </span>
            <h1 className="text-[clamp(28px,5vw,44px)] font-extrabold leading-[1.18] tracking-tight mb-4">
              우리 아이가 가장
              <br />
              사랑하는 목소리로,
              <br />
              <span className="text-primary">매일 밤 동화 한 편</span>
            </h1>
            <p className="text-foreground/70 text-[15px] sm:text-base mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
              엄마·아빠 목소리를 1분만 녹음하면, AI가 그 목소리 그대로
              동화를 읽어줘요. 곁에 없는 날에도 늘 함께예요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start">
              <Link
                href="/login?mode=signup&next=/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full text-[15px] font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
              >
                무료로 시작하기
                <span aria-hidden>→</span>
              </Link>
              <HeroSampleButton />
            </div>
          </div>

          {/* 우: 미니 플레이어 프리뷰 */}
          <div className="relative mx-auto w-full max-w-[320px] lg:max-w-[380px]">
            <div className="relative overflow-hidden rounded-2xl bg-[var(--night)] p-5 shadow-xl lg:rotate-[1.5deg]">
              <svg
                viewBox="0 0 300 200"
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 w-full h-full rounded-2xl pointer-events-none"
                aria-hidden
              >
                <circle cx="40" cy="26" r="1.3" fill="#EDE9F7" opacity="0.8" />
                <circle cx="90" cy="16" r="1.1" fill="#F4C566" opacity="0.8" />
              </svg>
              <div className="relative z-10">
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-[#3D3A5C] flex items-center justify-center">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"
                      fill="#F4C566"
                      opacity="0.9"
                    />
                  </svg>
                </div>
                <p className="text-white font-bold text-[15px] mb-3">
                  달님이 들려주는 자장가
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <VoiceAvatar emoji="👩" size={26} />
                  <span className="text-[13px] text-[var(--night-text)]">
                    엄마 목소리로 재생 중
                  </span>
                </div>
                <div className="flex items-center gap-[3px] h-8 mb-3">
                  {[14, 22, 30, 18, 26, 34, 20, 28, 16, 24, 12, 20, 30, 18, 22].map(
                    (h, i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-full"
                        style={{
                          height: `${h}px`,
                          background: i === 4 || i === 10 ? "#F4C566" : "#8B7FE0",
                          animation: `eq-bar 1100ms ease-in-out ${i * 70}ms infinite`,
                          transformOrigin: "bottom",
                        }}
                      />
                    )
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F4C566] text-[#2C2A45] flex items-center justify-center shrink-0">
                    <Play size={16} filled />
                  </div>
                  <div className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full w-2/5 bg-[#F4C566] rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -top-3 -right-1 bg-surface border border-border rounded-full pl-1 pr-3 py-1 shadow-md items-center gap-1.5 -rotate-[5deg]">
              <VoiceAvatar emoji="👵" size={22} />
              <span className="text-[12px] font-semibold">할머니 목소리</span>
            </div>
            <div className="hidden sm:flex absolute -bottom-3 -left-1 bg-surface border border-border rounded-full px-3 py-1.5 shadow-md items-center gap-1.5 rotate-[4deg]">
              <Moon size={14} className="text-primary" />
              <span className="text-[12px] font-semibold">잠자기 타이머 30분</span>
            </div>
          </div>
        </div>
      </section>

      {/* 사회적 증거 스트립 */}
      <div className="bg-background border-y border-border/60">
        <p className="max-w-5xl mx-auto px-6 py-3 text-center text-[13px] text-muted">
          동화 20편+
          <span className="mx-2 text-border-strong">·</span>
          가족 목소리 무제한
          <span className="mx-2 text-border-strong">·</span>
          녹음은 30초면 끝
        </p>
      </div>

      {/* Features — 벤토 그리드 */}
      <section className="relative overflow-hidden px-6 py-16 max-w-5xl mx-auto w-full">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <span className="lp-twinkle absolute w-1.5 h-1.5 rounded-full bg-[#F4C566]" style={{ top: "12%", left: "3%" }} />
          <span className="lp-twinkle absolute w-1.5 h-1.5 rounded-full bg-[#CEC7EE]" style={{ top: "68%", left: "5%", animationDelay: "1s" }} />
          <span className="lp-twinkle absolute w-1.5 h-1.5 rounded-full bg-[#CEC7EE]" style={{ top: "20%", right: "4%", animationDelay: "0.6s" }} />
          <span className="lp-twinkle absolute w-2 h-2 rounded-full bg-[#F4C566]" style={{ bottom: "14%", right: "3%", animationDelay: "1.4s" }} />
        </div>

        <Reveal>
          <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted font-semibold mb-1.5">
            Features
          </p>
          <h2 className="text-center text-[26px] font-extrabold mb-8 tracking-tight">
            이런 게 가능해요
          </h2>
        </Reveal>

        <div className="relative grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {/* 대형: 내 목소리 만들기 */}
          <Reveal className="sm:col-span-2 lg:col-span-1 lg:row-span-2" delay={0}>
            <div className="relative overflow-hidden rounded-2xl bg-[var(--night)] p-6 h-full transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
                <g transform="translate(160 34)"><circle cx="0" cy="0" r="11" fill="#F4C566" /><circle cx="5" cy="-3" r="9" fill="#2C2A45" /></g>
                <circle cx="40" cy="30" r="1.4" fill="#EDE9F7" opacity="0.8" />
                <circle cx="110" cy="20" r="1.1" fill="#F4C566" opacity="0.8" />
                <circle cx="30" cy="120" r="1.2" fill="#EDE9F7" opacity="0.5" />
              </svg>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-4">
                  <Mic size={22} filled />
                </div>
                <h3 className="text-white font-extrabold text-lg mb-1.5">내 목소리 만들기</h3>
                <p className="text-[13px] text-[var(--night-text)] leading-relaxed mb-5">
                  30초만 녹음하면 엄마 아빠 목소리를 AI가 똑같이 배워요.
                </p>
                <div className="flex items-end gap-[3px] h-8 mb-5">
                  {[12, 20, 30, 18, 26, 34, 20, 28, 16, 24, 12, 22, 30, 16].map((h, i) => (
                    <span key={i} className="w-[3px] rounded-full" style={{ height: `${h}px`, background: i === 5 ? "#F4C566" : "#8B7FE0", animation: `eq-bar 1100ms ease-in-out ${i * 70}ms infinite`, transformOrigin: "bottom" }} />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-auto">
                  <VoiceAvatar emoji="👩" size={26} />
                  <VoiceAvatar emoji="👨" size={26} />
                  <VoiceAvatar emoji="👵" size={26} />
                  <span className="w-[26px] h-[26px] rounded-full bg-white/10 text-white flex items-center justify-center text-sm font-bold">+</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 소형: AI 동화 만들기 */}
          <Reveal delay={50}>
            <div className="rounded-2xl border border-border bg-surface p-5 h-full transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-3">
                <Sparkles size={20} filled />
              </div>
              <h3 className="font-bold text-[15px] mb-1">AI 동화 만들기</h3>
              <p className="text-sm text-muted leading-relaxed">
                줄거리만 알려주면 우리 아이가 주인공인 동화를 만들어줘요.
              </p>
            </div>
          </Reveal>

          {/* 소형: 내 목소리로 들려주기 */}
          <Reveal delay={100}>
            <div className="rounded-2xl border border-border bg-surface p-5 h-full transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: "#FDF3D9", color: "#C99A2E" }}>
                <Play size={20} filled />
              </div>
              <h3 className="font-bold text-[15px] mb-1">내 목소리로 들려주기</h3>
              <p className="text-sm text-muted leading-relaxed">
                전래동화부터 영어동화까지, 부모님 목소리로 읽어줘요.
              </p>
            </div>
          </Reveal>

          {/* 와이드: 잠자기 타이머 */}
          <Reveal className="sm:col-span-2" delay={150}>
            <div className="relative overflow-hidden rounded-2xl bg-primary-light p-5 h-full transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <svg viewBox="0 0 80 80" className="absolute -right-4 -bottom-5 w-28 h-28 opacity-40 pointer-events-none" aria-hidden>
                <circle cx="40" cy="40" r="26" fill="#6E5FD6" opacity="0.25" />
                <circle cx="50" cy="33" r="22" fill="#EDE9F7" />
              </svg>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white text-primary flex items-center justify-center shrink-0">
                  <Moon size={20} filled />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] mb-0.5">잠자기 타이머</h3>
                  <p className="text-sm text-[var(--text-body)] leading-relaxed">
                    정한 시간이 지나면 저절로 멈춰요. 잠자리 동화에 딱이에요.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works — 다크 반전 섹션 */}
      <section className="relative overflow-hidden bg-[#2C2A45] px-6 py-16">
        {/* 별 + 초승달 장식 */}
        <svg
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden
        >
          <g transform="translate(58 52)">
            <circle cx="0" cy="0" r="12" fill="#F4C566" />
            <circle cx="5" cy="-3" r="10" fill="#2C2A45" />
          </g>
          <circle cx="330" cy="40" r="1.6" fill="#EDE9F7" opacity="0.8" />
          <circle cx="120" cy="28" r="1.3" fill="#F4C566" opacity="0.9" />
          <circle cx="264" cy="66" r="1.2" fill="#EDE9F7" opacity="0.6" />
          <circle cx="360" cy="150" r="1.4" fill="#EDE9F7" opacity="0.7" />
          <circle cx="44" cy="210" r="1.2" fill="#F4C566" opacity="0.7" />
          <circle cx="200" cy="250" r="1.1" fill="#EDE9F7" opacity="0.5" />
        </svg>
        {/* 언덕 실루엣 */}
        <svg
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 inset-x-0 w-full h-24 pointer-events-none"
          aria-hidden
        >
          <path d="M0 120 V70 Q100 40 200 60 T400 55 V120 Z" fill="#35325A" opacity="0.7" />
          <path d="M0 120 V92 Q120 64 240 82 T400 80 V120 Z" fill="#3D3A63" opacity="0.6" />
        </svg>

        <div className="max-w-5xl mx-auto relative z-10">
          <p
            className="text-center text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
            style={{ color: "#A79FD9" }}
          >
            How it works
          </p>
          <h2 className="text-center text-[26px] sm:text-[30px] font-extrabold mb-8 tracking-tight text-[#FBF9F6]">
            3단계로 끝나요
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="rounded-[12px] p-6"
                style={{ background: "#3D3A5C" }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold mb-4"
                  style={{ background: "#F4C566", color: "#5C4400" }}
                >
                  {item.step}
                </div>
                <h3 className="font-bold text-[16px] mb-1.5 text-white">
                  {item.title}
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: "#C9C3E8" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative overflow-hidden px-6 py-16 max-w-5xl mx-auto w-full">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <span className="lp-twinkle absolute w-1.5 h-1.5 rounded-full bg-[#CEC7EE]" style={{ top: "18%", left: "3%" }} />
          <span className="lp-twinkle absolute w-1.5 h-1.5 rounded-full bg-[#F4C566]" style={{ bottom: "20%", right: "4%", animationDelay: "0.9s" }} />
        </div>
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted font-semibold mb-1.5">
          Voices
        </p>
        <h2 className="text-center text-[26px] font-extrabold mb-8 tracking-tight">
          부모님들의 이야기
        </h2>
        <div className="relative grid gap-3.5 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.who} delay={i * 50}>
            <div className="card p-5 flex flex-col h-full">
              <div className="text-[#F4C566] text-sm mb-3 tracking-wider">
                ★★★★★
              </div>
              <p className="text-sm text-[var(--text-body)] leading-relaxed flex-1">
                “{t.quote}”
              </p>
              <div className="flex items-center gap-2 mt-4">
                <VoiceAvatar
                  emoji={
                    t.who.includes("아빠")
                      ? "👨"
                      : t.who.includes("할머니")
                      ? "👵"
                      : "👩"
                  }
                  size={28}
                />
                <p className="text-xs text-muted font-semibold">{t.who}</p>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA — 연보라 틴트 솔리드 */}
      <section className="relative overflow-hidden bg-primary-light px-6 py-16 text-center">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <span
            className="lp-twinkle absolute w-2 h-2 rounded-full bg-[#F4C566]"
            style={{ top: "22%", left: "16%" }}
          />
          <span
            className="lp-twinkle absolute w-1.5 h-1.5 rounded-full bg-[#CEC7EE]"
            style={{ top: "30%", right: "20%", animationDelay: "0.8s" }}
          />
          {/* 초승달 */}
          <svg
            className="lp-float absolute w-9 h-9"
            style={{ top: "18%", left: "10%" }}
            viewBox="0 0 40 40"
            aria-hidden
          >
            <circle cx="20" cy="20" r="13" fill="#F4C566" opacity="0.9" />
            <circle cx="25" cy="16" r="11" fill="#EDE9F7" />
          </svg>
          <svg
            className="lp-float absolute w-14 h-10"
            style={{ top: "16%", right: "12%" }}
            viewBox="0 0 200 120"
            fill="none"
            stroke="#CEC7EE"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M80 40 L180 15 L150 85 L130 55 L80 40 Z" />
            <path d="M130 55 L180 15" />
          </svg>
        </div>
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-[26px] sm:text-[30px] font-extrabold mb-3 tracking-tight text-foreground">
            오늘 밤, 한 편 들려줄까요?
          </h2>
          <p className="text-sm text-[var(--text-body)] mb-7 leading-relaxed">
            지금 가입하면 바로 우리 아이만의 동화를 시작할 수 있어요.
          </p>
          <Link
            href="/login?mode=signup&next=/"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full text-[15px] font-bold hover:bg-primary-dark transition"
          >
            오늘 밤부터 함께하기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background px-6 py-12 text-center border-t border-border">
        <p className="text-lg font-extrabold text-primary tracking-tight mb-1">
          마이보이스스토리
          <span className="text-foreground/60 font-bold"> for kids</span>
        </p>
        <p className="text-xs text-muted">
          엄마 아빠 목소리로 들려주는 우리 아이 동화
        </p>

        <div className="mx-auto my-6 h-px w-10 bg-border" />

        <p className="text-[11px] font-semibold text-muted tracking-wide">
          서강대학교 · 생성형 AI의 이해와 활용 9조
        </p>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted/70">
          <span>김현정</span>
          <span aria-hidden className="text-muted/40">·</span>
          <span>김국희</span>
          <span aria-hidden className="text-muted/40">·</span>
          <span>최지은</span>
        </div>

        <p className="text-[10px] text-muted/50 tracking-wide mt-6">
          © 2026 MyVoiceStory for kids
        </p>
      </footer>
    </div>
  );
}
