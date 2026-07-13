import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import SleepModeWatcher from "@/components/SleepModeWatcher";

// 페인트 전에 밤 테마 클래스를 미리 반영해 새로고침 깜빡임을 방지.
// (날짜가 바뀌었으면 저장값을 지워 자동 해제)
const SLEEP_BOOT = `(function(){try{var d=new Date();var t=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();var ld=localStorage.getItem('mvk.sleepModeDate');if(ld&&ld!==t){localStorage.removeItem('mvk.sleepMode');localStorage.removeItem('mvk.sleepModeDate');return;}var raw=localStorage.getItem('mvk.sleepMode');if(raw){var s=JSON.parse(raw);if(s&&s.active){document.documentElement.classList.add('sleep-mode');}}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "마이보이스스토리 for kids — AI 목소리 동화 서비스",
  description: "부모의 목소리로 아이에게 동화를 읽어주는 AI 육아 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: SLEEP_BOOT }} />
      </head>
      <body className="min-h-full">
        <SleepModeWatcher />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
