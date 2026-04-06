"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "홈", icon: "🏠", activeIcon: "🏠" },
  { href: "/create", label: "만들기", icon: "✨", activeIcon: "✨" },
  { href: "/record", label: "목소리", icon: "🎙️", activeIcon: "🎙️" },
  { href: "/mypage", label: "내 서재", icon: "📖", activeIcon: "📖" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // 플레이어 화면에서는 숨김
  if (pathname.startsWith("/player")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-all ${
                isActive ? "text-primary scale-105" : "text-muted"
              }`}
            >
              <span className="text-xl">{isActive ? tab.activeIcon : tab.icon}</span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
