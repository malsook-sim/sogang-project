"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-light via-background to-background" />
        <div className="relative z-10">
          <div className="text-7xl mb-6">📖</div>
          <h1 className="text-4xl font-extrabold mb-3 leading-tight">
            <span className="text-primary">동화야</span>,<br />
            읽어줘
          </h1>
          <p className="text-muted text-lg mb-8 leading-relaxed max-w-xs mx-auto">
            부모님의 목소리로<br />
            아이에게 동화를 들려주세요
          </p>

          <Link
            href="/"
            className="inline-block bg-primary text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20 mb-4"
          >
            시작하기
          </Link>
          <p className="text-xs text-muted">무료로 체험해보세요</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 max-w-lg mx-auto w-full">
        <h2 className="text-center text-xl font-extrabold mb-8">
          이런 게 가능해요
        </h2>
        <div className="flex flex-col gap-4">
          {[
            {
              emoji: "🎙️",
              title: "목소리 복제",
              desc: "30초 녹음만으로 부모님 목소리를 AI가 학습해요",
              color: "bg-primary-light",
            },
            {
              emoji: "✨",
              title: "AI 동화 생성",
              desc: "줄거리만 알려주면 우리 아이만의 동화를 만들어요",
              color: "bg-secondary-light",
            },
            {
              emoji: "🔊",
              title: "실시간 낭독",
              desc: "부모님 목소리로 동화를 읽어줘요. 기본 성우도 제공",
              color: "bg-accent-light",
            },
            {
              emoji: "🌙",
              title: "수면 타이머",
              desc: "설정한 시간 뒤 자동으로 멈춰요. 잠자리 동화에 딱!",
              color: "bg-blue-50",
            },
          ].map((feat, i) => (
            <div
              key={i}
              className={`${feat.color} rounded-2xl p-5 flex items-start gap-4`}
            >
              <div className="text-3xl flex-shrink-0">{feat.emoji}</div>
              <div>
                <h3 className="font-bold mb-0.5">{feat.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-12 bg-white">
        <div className="max-w-lg mx-auto">
          <h2 className="text-center text-xl font-extrabold mb-8">
            3단계로 간단하게
          </h2>
          <div className="flex flex-col gap-6">
            {[
              { step: "1", title: "목소리 녹음", desc: "간단한 문장 5개를 읽어주세요" },
              { step: "2", title: "동화 선택", desc: "전래동화부터 AI 생성 동화까지" },
              { step: "3", title: "들려주기", desc: "내 목소리로 동화가 시작돼요" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-extrabold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-12 text-center">
        <h2 className="text-xl font-extrabold mb-3">
          지금 바로 시작해볼까요?
        </h2>
        <p className="text-sm text-muted mb-6">
          회원가입 없이 체험할 수 있어요
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
        >
          동화 둘러보기
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 px-6 py-8 text-center">
        <p className="text-2xl font-extrabold text-primary mb-1">동화야</p>
        <p className="text-xs text-muted">
          &copy; 2026 Donghwaya. AI 목소리 동화 서비스
        </p>
      </footer>
    </div>
  );
}
