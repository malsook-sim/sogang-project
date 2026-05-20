"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { Home, Sparkles, Mic, Library } from "@/components/Icon";

const navItems = [
  { href: "/", label: "홈", Icon: Home },
  { href: "/create", label: "동화 만들기", Icon: Sparkles },
  { href: "/record", label: "목소리 녹음", Icon: Mic },
  { href: "/mypage", label: "내 서재", Icon: Library },
];

// 셸(사이드바/하단탭) 없이 단독으로 그리는 화면
const BARE_PREFIXES = ["/player", "/landing", "/login"];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bare = BARE_PREFIXES.some((p) => pathname.startsWith(p));

  if (bare) return <>{children}</>;

  return (
    <div className="lg:pl-60">
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 bg-surface border-r border-border px-4 py-6 z-50">
        <Link href="/" className="block px-3 mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-semibold mb-0.5">
            MyVoiceStory
          </p>
          <p className="text-lg font-extrabold text-primary tracking-tight leading-tight">
            마이보이스스토리
          </p>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  active
                    ? "bg-primary-light text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface-soft"
                }`}
              >
                <item.Icon size={20} filled={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="pb-24 lg:pb-0">{children}</div>

      <BottomNav />
    </div>
  );
}
