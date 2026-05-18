"use client";

import Link from "next/link";
import { Mic, Sparkles, Play, Moon } from "@/components/Icon";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <section className="bg-hero-warm relative overflow-hidden">
        <div className="max-w-lg mx-auto px-6 pt-20 pb-16 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-surface border border-border text-foreground/80 text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            보호자 목소리로 듣는 동화
          </span>
          <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-tight mb-4">
            <span className="text-primary">마이보이스스토리</span>
            <br />
            <span className="text-foreground/85">for kids.</span>
          </h1>
          <p className="text-foreground/70 text-base mb-9 leading-relaxed max-w-sm mx-auto">
            엄마·아빠의 목소리로 아이에게<br />
            동화 한 편 들려주세요.
          </p>

          <div className="flex flex-col gap-3 items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full text-[15px] font-semibold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
            >
              지금 시작하기
              <span aria-hidden>→</span>
            </Link>
            <p className="text-[11px] text-muted">회원가입 없이 체험 가능</p>
          </div>
        </div>

        <svg
          className="absolute inset-x-0 -bottom-1 w-full text-background"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 40V20Q100 0 200 20T400 20V40z" fill="currentColor" />
        </svg>
      </section>

      <section className="px-6 py-14 max-w-lg mx-auto w-full">
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted font-semibold mb-2">
          Features
        </p>
        <h2 className="text-center text-2xl font-extrabold mb-10 tracking-tight">
          이런 게 가능해요
        </h2>

        <div className="grid gap-3">
          {[
            {
              Icon: Mic,
              title: "목소리 복제",
              desc: "30초 녹음만으로 부모님 목소리를 AI가 학습해요",
              tone: "primary" as const,
            },
            {
              Icon: Sparkles,
              title: "AI 동화 생성",
              desc: "줄거리만 알려주면 우리 아이만의 동화를 만들어요",
              tone: "secondary" as const,
            },
            {
              Icon: Play,
              title: "실시간 낭독",
              desc: "부모님 목소리로 동화를 읽어줘요. 기본 성우도 제공",
              tone: "accent" as const,
            },
            {
              Icon: Moon,
              title: "수면 타이머",
              desc: "설정한 시간 뒤 자동으로 멈춰요. 잠자리 동화에 딱.",
              tone: "neutral" as const,
            },
          ].map((feat, i) => {
            const toneClass =
              feat.tone === "primary"
                ? "bg-primary-light text-primary"
                : feat.tone === "secondary"
                ? "bg-secondary-light text-secondary"
                : feat.tone === "accent"
                ? "bg-accent-light text-accent"
                : "bg-surface-soft text-foreground";
            return (
              <div
                key={i}
                className="card p-5 flex items-start gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${toneClass}`}
                >
                  <feat.Icon size={22} filled />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[15px] mb-0.5">{feat.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-6 py-14 bg-surface border-y border-border">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted font-semibold mb-2">
            How it works
          </p>
          <h2 className="text-center text-2xl font-extrabold mb-10 tracking-tight">
            3단계로 끝나요
          </h2>
          <div className="relative">
            <div
              className="absolute left-6 top-2 bottom-2 w-px bg-border"
              aria-hidden
            />
            <div className="flex flex-col gap-8">
              {[
                { step: "01", title: "목소리 녹음", desc: "간단한 문장 5개를 또박또박 읽어주세요" },
                { step: "02", title: "동화 선택", desc: "전래동화부터 AI 생성 동화까지 자유롭게" },
                { step: "03", title: "들려주기", desc: "내 목소리로 동화가 시작돼요" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-5 relative">
                  <div className="relative z-10 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-extrabold tracking-wider flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] mb-0.5">{item.title}</h3>
                    <p className="text-sm text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center bg-hero-warm">
        <h2 className="text-2xl font-extrabold mb-3 tracking-tight">
          오늘 저녁, 한 편 들려줄까요?
        </h2>
        <p className="text-sm text-muted mb-7 leading-relaxed">
          회원가입 없이 체험할 수 있어요.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-[15px] font-semibold hover:bg-foreground/85 transition"
        >
          동화 둘러보기
          <span aria-hidden>→</span>
        </Link>
      </section>

      <footer className="bg-surface-soft px-6 py-10 text-center border-t border-border">
        <p className="text-lg font-extrabold text-primary tracking-tight mb-1">
          마이보이스스토리
          <span className="text-foreground/60 font-bold"> for kids</span>
        </p>
        <p className="text-[11px] text-muted tracking-wide">
          © 2026 MyVoiceStory for kids · AI 목소리 동화 서비스
        </p>
      </footer>
    </div>
  );
}
