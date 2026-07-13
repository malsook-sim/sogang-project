import type { ReactNode } from "react";

// 밤하늘 풀스크린 배경 — 404/에러 화면 공용.
// fixed inset-0 로 사이드바·탭바 위를 덮어 로그인 여부·레이아웃과 무관하게 단독 표시.
const STARS = [
  { top: "15%", left: "13%", s: 2.5, c: "#F4C566", d: "0s" },
  { top: "23%", left: "82%", s: 2, c: "#EDE9F7", d: "0.6s" },
  { top: "38%", left: "27%", s: 1.5, c: "#EDE9F7", d: "1.2s" },
  { top: "57%", left: "85%", s: 2.5, c: "#F4C566", d: "0.3s" },
  { top: "67%", left: "16%", s: 2, c: "#EDE9F7", d: "1.6s" },
  { top: "78%", left: "63%", s: 1.5, c: "#EDE9F7", d: "0.9s" },
  { top: "33%", left: "55%", s: 1.5, c: "#F4C566", d: "2s" },
  { top: "85%", left: "38%", s: 2, c: "#EDE9F7", d: "1.1s" },
];

export function NightSky({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden bg-[#2C2A45] flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* 초승달 */}
      <svg
        className="absolute top-10 right-10 w-14 h-14 lp-float pointer-events-none"
        viewBox="0 0 48 48"
        aria-hidden
      >
        <circle cx="24" cy="24" r="24" fill="#F4C566" />
        <circle cx="33" cy="18" r="21" fill="#2C2A45" />
      </svg>

      {/* 별 twinkle */}
      {STARS.map((st, i) => (
        <span
          key={i}
          aria-hidden
          className="lp-twinkle absolute rounded-full pointer-events-none"
          style={{
            top: st.top,
            left: st.left,
            width: st.s,
            height: st.s,
            backgroundColor: st.c,
            animationDelay: st.d,
          }}
        />
      ))}

      {/* 종이비행기 (별 사이를 지나는 느낌) + 점선 자취 */}
      <svg
        className="absolute top-[28%] left-[14%] w-16 h-16 lp-sway pointer-events-none"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
      >
        <path
          d="M6 40 Q 18 34 26 22"
          stroke="#C9C3E8"
          strokeWidth="1.1"
          strokeDasharray="2 4"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M40 8 L20 18 l8.5 3.2 M40 8 L28.5 27 l-3.2 -8.6 z"
          fill="rgba(201,195,232,0.18)"
          stroke="#C9C3E8"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center max-w-sm">
        {children}
      </div>
    </div>
  );
}
