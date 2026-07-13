"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, Sparkles, Moon } from "@/components/Icon";

type Mode = "login" | "signup";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialNote, setSocialNote] = useState("");

  const emailTrim = email.trim();
  const emailError = !emailTrim
    ? "이메일을 입력해 주세요."
    : !/^\S+@\S+\.\S+$/.test(emailTrim)
    ? "이메일 형식이 올바르지 않아요."
    : "";
  const pwError = !password
    ? "비밀번호를 입력해 주세요."
    : mode === "signup" && password.length < 6
    ? "비밀번호는 6자 이상이에요."
    : "";

  const showEmailError = (submitted || touched.email) && emailError;
  const showPwError = (submitted || touched.password) && pwError;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setSubmitted(true);
    setFormError("");
    if (emailError || pwError) return;

    setLoading(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrim, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "문제가 생겼어요. 다시 시도해 주세요.");
        return;
      }
      if (mode === "signup") {
        const dest =
          next && next !== "/"
            ? `/onboarding?next=${encodeURIComponent(next)}`
            : "/onboarding";
        router.push(dest);
      } else {
        window.location.replace(next);
      }
    } catch {
      setFormError("문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setSubmitted(false);
    setTouched({});
    setFormError("");
  };

  const features = [
    { Icon: Mic, text: "30초 녹음으로 엄마 아빠 목소리를 그대로" },
    { Icon: Sparkles, text: "우리 아이만을 위한 AI 동화 한 편" },
    { Icon: Moon, text: "잠자리 타이머로 스르르 잠들 때까지" },
  ];

  return (
    <div className="auth-theme min-h-screen bg-[var(--color-bg)] md:grid md:grid-cols-[46fr_54fr]">
      {/* 왼쪽 밤하늘 브랜드 패널 (데스크탑) */}
      <aside className="hidden md:flex md:flex-col md:justify-between relative overflow-hidden bg-[var(--color-night)] p-12 lg:p-16">
        {/* 별 + 초승달 장식 */}
        <svg
          viewBox="0 0 400 560"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden
        >
          <g transform="translate(312 76)">
            <circle cx="0" cy="0" r="24" fill="#F4C566" />
            <circle cx="9" cy="-6" r="21" fill="#2C2A45" />
          </g>
          <circle cx="70" cy="70" r="1.6" fill="#EDE9F7" />
          <circle cx="120" cy="52" r="1.2" fill="#F4C566" />
          <circle cx="52" cy="150" r="1.4" fill="#EDE9F7" opacity="0.8" />
          <circle cx="250" cy="120" r="1.3" fill="#F4C566" opacity="0.9" />
          <circle cx="180" cy="96" r="1" fill="#EDE9F7" opacity="0.7" />
          <circle cx="330" cy="180" r="1.5" fill="#EDE9F7" opacity="0.8" />
          <circle cx="96" cy="240" r="1.2" fill="#F4C566" opacity="0.7" />
          <circle cx="286" cy="250" r="1.1" fill="#EDE9F7" opacity="0.6" />
        </svg>

        <Link href="/landing" className="relative z-10 inline-block">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-night-muted)] font-semibold mb-1">
            MyVoiceStory for kids
          </p>
          <p className="text-2xl font-extrabold tracking-tight text-white">
            마이보이스스토리
          </p>
        </Link>

        <div className="relative z-10 max-w-sm">
          <h2 className="text-[28px] lg:text-[32px] font-extrabold leading-snug text-white mb-8">
            오늘 밤도,
            <br />
            엄마 아빠 목소리로
            <br />
            <span className="text-[var(--color-star)]">동화 한 편</span>
          </h2>
          <ul className="space-y-4">
            {features.map(({ Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-[15px] text-[var(--color-night-text)]"
              >
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[13px] text-[var(--color-night-muted)]">
          서강대학교 · 생성형 AI의 이해와 활용 9조
        </p>
      </aside>

      {/* 오른쪽 폼 */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[400px] mx-auto">
          <p className="md:hidden text-[11px] uppercase tracking-[0.2em] text-[var(--color-primary)] font-semibold mb-6">
            마이보이스스토리
          </p>

          <h1 className="text-[26px] font-extrabold text-[var(--color-night)] tracking-tight mb-2">
            {mode === "login" ? "다시 오셨네요" : "함께 시작해요"}
          </h1>
          <p className="text-[15px] text-[var(--color-text-sub)] mb-8">
            {mode === "login"
              ? "이어서 우리 아이 동화를 들려주세요"
              : "이메일로 간단하게 가입할 수 있어요"}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* 이메일 */}
            <label className="block text-[13px] font-semibold text-[var(--color-label)] mb-1.5">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="example@email.com"
              autoComplete="email"
              className="w-full h-11 px-3.5 rounded-[10px] bg-white text-[15px] text-[var(--color-text)] border border-[var(--color-border)] placeholder:text-[var(--color-placeholder)] focus:outline-none focus:border-[1.5px] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary-soft)] transition"
            />
            {showEmailError ? (
              <p className="mt-1.5 text-[13px] text-[#E5606B]">{emailError}</p>
            ) : null}

            {/* 비밀번호 */}
            <label className="block text-[13px] font-semibold text-[var(--color-label)] mb-1.5 mt-4">
              비밀번호
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder={mode === "signup" ? "6자 이상" : "비밀번호"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="w-full h-11 pl-3.5 pr-11 rounded-[10px] bg-white text-[15px] text-[var(--color-text)] border border-[var(--color-border)] placeholder:text-[var(--color-placeholder)] focus:outline-none focus:border-[1.5px] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary-soft)] transition"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition"
                aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 표시"}
              >
                {showPw ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {showPwError ? (
              <p className="mt-1.5 text-[13px] text-[#E5606B]">{pwError}</p>
            ) : null}

            {formError ? (
              <p className="mt-4 text-[13px] text-[#C4444F] bg-[#FBEBEC] rounded-lg px-3 py-2">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-6 rounded-[10px] bg-[var(--color-primary)] text-white font-bold text-[15px] hover:bg-[#5D4FC4] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "잠시만요..."
                : mode === "login"
                ? "로그인"
                : "가입하고 시작하기"}
            </button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center gap-3 my-6">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-[12px] text-[var(--color-text-sub)]">또는</span>
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          {/* 소셜 로그인 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSocialNote("소셜 로그인은 곧 지원될 예정이에요.")}
              className="h-11 rounded-[10px] bg-white border border-[var(--color-border)] flex items-center justify-center gap-2 text-[14px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-primary-soft)]/40 transition"
            >
              <GoogleMark /> Google
            </button>
            <button
              type="button"
              onClick={() => setSocialNote("소셜 로그인은 곧 지원될 예정이에요.")}
              className="h-11 rounded-[10px] bg-white border border-[var(--color-border)] flex items-center justify-center gap-2 text-[14px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-primary-soft)]/40 transition"
            >
              <AppleMark /> Apple
            </button>
          </div>
          {socialNote ? (
            <p className="mt-2.5 text-center text-[12px] text-[var(--color-text-sub)]">
              {socialNote}
            </p>
          ) : null}

          {/* 전환 링크 */}
          <p className="text-center mt-8 text-[14px] text-[var(--color-text-sub)]">
            {mode === "login" ? (
              <>
                아직 회원이 아니신가요?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="text-[var(--color-primary)] font-semibold hover:underline"
                >
                  회원가입
                </button>
              </>
            ) : (
              <>
                이미 회원이신가요?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="text-[var(--color-primary)] font-semibold hover:underline"
                >
                  로그인
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Eye() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9.9 4.8A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.1-.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3 0-5.6-2-6.5-4.8H1.5v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.5 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.5a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.5 6.7l4 3.1C6.4 6.9 9 4.8 12 4.8Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.4 12.7c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.7 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.4-.9-2.4-3.5ZM14 5.4c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.7-1.3Z" />
    </svg>
  );
}
