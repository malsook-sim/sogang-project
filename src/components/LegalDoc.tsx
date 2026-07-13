import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "@/components/Icon";

// 약관/개인정보 처리방침 공통 문서 레이아웃 (읽기용 단독 화면)
export function LegalDoc({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-theme min-h-screen bg-[var(--color-bg)]">
      <header className="sticky top-0 z-10 bg-[var(--color-bg)]/90 backdrop-blur border-b border-[var(--color-border)]">
        <div className="max-w-[720px] mx-auto px-5 h-14 flex items-center gap-2">
          <Link
            href="/"
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[var(--color-text-sub)] hover:bg-white/60 transition"
            aria-label="닫기"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-[16px] font-extrabold text-[var(--color-night)] tracking-tight">
            {title}
          </h1>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-6 py-8">
        <p className="text-[12px] text-[var(--color-text-sub)] mb-6">
          시행일 {updatedAt} · 마이보이스스토리 for 키즈
        </p>
        <div className="space-y-6 text-[14px] leading-relaxed text-[var(--color-text)]">
          {children}
        </div>
        <p className="mt-10 text-[12px] text-[var(--color-text-sub)] leading-relaxed border-t border-[var(--color-border)] pt-5">
          본 문서는 서강대학교 생성형 AI 수업 프로젝트(POC)를 위한 초안이며, 실제
          서비스 출시 시 관련 법령에 맞추어 보완됩니다.
        </p>
      </main>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[15px] font-bold text-[var(--color-night)] mb-2">
        {heading}
      </h2>
      <div className="space-y-1.5 text-[var(--color-label)]">{children}</div>
    </section>
  );
}
