"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentUser, displayName } from "@/lib/useCurrentUser";

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}

const AGES = [3, 4, 5, 6, 7, 8];

function OnboardingContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { user } = useCurrentUser();

  const [name, setName] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const finish = async (withData: boolean) => {
    if (saving) return;
    if (withData && name.trim()) {
      setSaving(true);
      try {
        await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            childName: name.trim(),
            childAge: age ?? "",
          }),
        });
      } catch {
        // 저장 실패해도 진행은 막지 않음
      }
    }
    window.location.replace(next);
  };

  return (
    <div className="auth-theme min-h-screen bg-[var(--color-bg)] flex flex-col justify-center px-6 py-12">
      <div className="w-full max-w-[400px] mx-auto">
        {/* 별/달 장식 */}
        <svg width="72" height="40" viewBox="0 0 72 40" className="mb-6" aria-hidden>
          <g transform="translate(16 18)">
            <circle cx="0" cy="0" r="13" fill="#F4C566" />
            <circle cx="6" cy="-4" r="11" fill="var(--color-bg)" />
          </g>
          <path
            d="M44 8 l1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6z"
            fill="#F4C566"
          />
          <circle cx="58" cy="24" r="2" fill="#CEC7EE" />
          <circle cx="38" cy="28" r="1.6" fill="#CEC7EE" />
        </svg>

        {user ? (
          <p className="text-[14px] font-bold text-[var(--color-primary)] mb-1.5">
            {displayName(user)}, 환영해요 🎉
          </p>
        ) : null}
        <h1 className="text-[20px] font-extrabold text-[var(--color-text)] tracking-tight mb-1.5">
          아이를 소개해 주세요
        </h1>
        <p className="text-[14px] text-[var(--color-text-sub)] mb-8">
          동화 추천과 인사말에 사용돼요
        </p>

        <label className="block text-[13px] font-semibold text-[var(--color-label)] mb-1.5">
          아이 이름
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 지우"
          maxLength={20}
          autoFocus
          className="w-full h-11 px-3.5 rounded-[10px] bg-white text-[15px] text-[var(--color-text)] border border-[var(--color-border)] placeholder:text-[var(--color-placeholder)] focus:outline-none focus:border-[1.5px] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary-soft)] transition"
        />

        <label className="block text-[13px] font-semibold text-[var(--color-label)] mb-2 mt-5">
          아이 나이
        </label>
        <div className="flex flex-wrap gap-2">
          {AGES.map((a) => {
            const active = age === a;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAge(active ? null : a)}
                className={`px-4 h-10 rounded-full text-[14px] font-semibold border transition ${
                  active
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                }`}
              >
                {a}세
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => finish(true)}
          disabled={!name.trim() || saving}
          className="w-full h-12 mt-8 rounded-[10px] bg-[var(--color-primary)] text-white font-bold text-[15px] hover:bg-[#5D4FC4] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "저장 중..." : "시작하기"}
        </button>
        <button
          type="button"
          onClick={() => finish(false)}
          disabled={saving}
          className="w-full h-11 mt-2 text-[14px] font-semibold text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition"
        >
          나중에 할게요
        </button>
      </div>
    </div>
  );
}
