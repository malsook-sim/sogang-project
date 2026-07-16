"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SleepIndicator from "@/components/SleepIndicator";
import { Home, Sparkles, Mic, Library } from "@/components/Icon";
import { useCurrentUser } from "@/lib/useCurrentUser";

const navItems = [
  { href: "/", label: "홈", Icon: Home },
  { href: "/create", label: "동화 만들기", Icon: Sparkles },
  { href: "/record", label: "목소리 녹음", Icon: Mic },
  { href: "/mypage", label: "내 서재", Icon: Library },
];

// 셸(사이드바/하단탭) 없이 단독으로 그리는 화면
const BARE_PREFIXES = [
  "/player",
  "/landing",
  "/login",
  "/onboarding",
  "/terms",
  "/privacy",
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_PREFIXES.some((p) => pathname.startsWith(p));
  const { user } = useCurrentUser();

  if (bare) return <>{children}</>;

  return (
    <div className="lg:pl-[220px]">
      <aside className="app-sidebar hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[220px] bg-surface border-r border-border px-3.5 py-6 z-50">
        <Link href="/" className="block px-3 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-horizontal.svg"
            alt="마이보이스스토리"
            className="brand-logo h-9 w-auto"
          />
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-semibold transition ${
                  active
                    ? "is-active bg-primary-light text-[var(--primary-deep)]"
                    : "text-[var(--text-body)] hover:bg-background"
                }`}
              >
                <span className={`nav-icon ${active ? "text-primary" : ""}`}>
                  <item.Icon size={20} filled={active} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 하단 아이 프로필 카드 */}
        {user ? (
          user.childName ? (
            <Link
              href="/mypage"
              className="app-profile-card mt-auto flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-background transition"
            >
              <div className="w-9 h-9 rounded-full bg-[var(--star)] text-[#4A3A12] flex items-center justify-center font-extrabold text-sm shrink-0">
                {user.childName.trim().charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {user.childName}
                </p>
                <p className="text-[11px] text-muted">
                  {user.childAge ? `${user.childAge}세` : "프로필 설정"}
                </p>
              </div>
            </Link>
          ) : (
            <Link
              href="/onboarding"
              className="mt-auto flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-border-strong text-[var(--text-body)] hover:bg-background hover:text-primary transition"
            >
              <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-lg shrink-0">
                +
              </div>
              <span className="text-sm font-semibold">아이 등록하기</span>
            </Link>
          )
        ) : null}
      </aside>

      <div className="pb-24 lg:pb-0">{children}</div>

      <SleepIndicator />
      <BottomNav />
    </div>
  );
}
