"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Mic, Library } from "@/components/Icon";

const tabs = [
  { href: "/", label: "홈", Icon: Home },
  { href: "/create", label: "만들기", Icon: Sparkles },
  { href: "/record", label: "목소리", Icon: Mic },
  { href: "/mypage", label: "내 서재", Icon: Library },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/player")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border z-50 lg:hidden">
      <div className="max-w-lg mx-auto flex justify-around items-stretch h-[68px] pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`group relative flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${
                isActive ? "text-primary" : "text-muted hover:text-foreground"
              }`}
            >
              <span
                aria-hidden
                className={`absolute top-0 h-[2px] w-8 rounded-full transition-all ${
                  isActive ? "bg-primary opacity-100" : "opacity-0"
                }`}
              />
              <tab.Icon size={22} filled={isActive} strokeWidth={isActive ? 2 : 1.75} />
              <span className={`text-[10px] tracking-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
