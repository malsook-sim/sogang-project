"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, User } from "@/components/Icon";

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
  const next = searchParams.get("next") || "/mypage";

  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("5");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, childName, childAge };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "문제가 생겼어요. 다시 시도해 주세요.");
        return;
      }
      window.location.replace(next);
    } catch {
      setError("문제가 생겼어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
  };

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-foreground transition"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-sm tracking-tight">
            {mode === "login" ? "로그인" : "회원가입"}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
            <User size={26} filled />
          </div>
          <h2 className="text-xl font-extrabold mb-2 tracking-tight">
            {mode === "login"
              ? "다시 오셨네요!"
              : "마이보이스키즈 시작하기"}
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            {mode === "login"
              ? "로그인하면 내 목소리와 동화를 이어서 볼 수 있어요"
              : "이메일로 간단하게 가입할 수 있어요"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-5">
          <label className="text-[11px] text-muted font-semibold mb-1 block">
            이메일
          </label>
          <input
            type="email"
            name="email"
            placeholder="example@email.com"
            autoComplete="email"
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-soft text-sm focus:outline-none focus:border-primary focus:bg-surface transition mb-3.5"
          />

          <label className="text-[11px] text-muted font-semibold mb-1 block">
            비밀번호
          </label>
          <input
            type="password"
            name="password"
            placeholder={mode === "signup" ? "6자 이상" : "비밀번호"}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-soft text-sm focus:outline-none focus:border-primary focus:bg-surface transition"
          />

          {mode === "signup" && (
            <div className="mt-3.5">
              <label className="text-[11px] text-muted font-semibold mb-1 block">
                아이 정보{" "}
                <span className="text-muted/70 font-normal">(선택)</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="아이 이름 (예: 지우)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface-soft text-sm focus:outline-none focus:border-primary focus:bg-surface transition"
                />
                <select
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="w-24 px-3 py-2.5 rounded-xl border border-border bg-surface-soft text-sm focus:outline-none focus:border-primary transition"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((age) => (
                    <option key={age} value={age}>
                      {age}세
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3.5 text-xs text-danger font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? "잠시만요..."
              : mode === "login"
              ? "로그인"
              : "가입하고 시작하기"}
          </button>
        </form>

        <div className="text-center mt-5 text-sm text-muted">
          {mode === "login" ? (
            <>
              아직 회원이 아니신가요?{" "}
              <button
                onClick={() => switchMode("signup")}
                className="text-primary font-semibold hover:underline"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 회원이신가요?{" "}
              <button
                onClick={() => switchMode("login")}
                className="text-primary font-semibold hover:underline"
              >
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
