"use client";

import { useEffect } from "react";
import Link from "next/link";
import { NightSky } from "@/components/NightSky";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 에러 상세/스택은 콘솔에만 기록하고 화면에는 절대 노출하지 않음
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <NightSky>
      {/* 작은 달 아이콘 대신 은은한 장식 문구 워터마크 */}
      <div className="relative flex flex-col items-center">
        <span
          aria-hidden
          className="text-[64px] sm:text-[80px] leading-none select-none"
        >
          💫
        </span>
        <h1 className="mt-4 text-[22px] font-extrabold text-[#FBF9F6]">
          잠깐 딸꾹질을 했어요
        </h1>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-[#C9C3E8]">
        일시적인 문제예요. 다시 시도해 주세요.
      </p>

      <div className="mt-8 flex items-center gap-2.5">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-primary text-white font-bold text-[15px] hover:bg-primary-dark transition shadow-lg shadow-primary/30"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-[#C9C3E8]/40 text-[#FBF9F6] font-semibold text-[15px] hover:bg-white/10 transition"
        >
          홈으로
        </Link>
      </div>
    </NightSky>
  );
}
