"use client";

import { useState } from "react";
import { Moon } from "@/components/Icon";
import {
  useSleepMode,
  useSleepRemaining,
  extendSleepTimer,
  stopSleepMode,
} from "@/lib/sleepMode";

// 헤더 우측 고정 수면 모드 인디케이터 — 어느 화면에서든 끌 수 있음.
// (플레이어는 자체 헤더 컨트롤을 쓰므로 셸이 없는 플레이어에는 렌더되지 않음)
export default function SleepIndicator() {
  const { active, endsAt } = useSleepMode();
  const remaining = useSleepRemaining();
  const [open, setOpen] = useState(false);

  if (!active) return null;

  const mins = endsAt && remaining > 0 ? Math.ceil(remaining / 60) : null;

  return (
    <div className="fixed top-3 right-3 z-[45]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-9 pl-2.5 pr-3 rounded-full bg-[#3D3A5C] border border-white/10 text-[#F4C566] text-xs font-bold tabular-nums shadow-lg shadow-black/20 hover:bg-[#474269] transition"
        aria-label="수면 모드"
      >
        <Moon size={15} filled />
        {mins ? `${mins}분` : "수면"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-[#2C2A45] border border-white/10 rounded-2xl shadow-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Moon size={15} filled className="text-[#F4C566]" />
              <p className="text-sm font-bold text-[#FBF9F6]">수면 모드</p>
              {mins ? (
                <span className="ml-auto text-xs font-semibold text-[#C9C3E8] tabular-nums">
                  {mins}분 남음
                </span>
              ) : (
                <span className="ml-auto text-xs text-[#7A73A8]">타이머 종료</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => extendSleepTimer(15)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-[#3D3A5C] text-[#C9C3E8] hover:bg-[#474269] transition"
              >
                +15분 연장
              </button>
              <button
                onClick={() => {
                  stopSleepMode();
                  setOpen(false);
                }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-[#F4C566]/15 text-[#F4C566] hover:bg-[#F4C566]/25 transition"
              >
                끄기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
