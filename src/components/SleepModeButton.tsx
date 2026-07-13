"use client";

import { useState } from "react";
import { Moon } from "@/components/Icon";
import {
  useSleepMode,
  useSleepRemaining,
  startSleepTimer,
  extendSleepTimer,
  stopSleepMode,
} from "@/lib/sleepMode";

// 홈 등 셸 화면 헤더용 잠자기 모드 컨트롤.
// 꺼짐 → 타이머(15/30/60분)로 켜기 · 켜짐 → 연장/끄기. 전역 sleepMode 스토어 사용.
const DURATIONS = [15, 30, 60];

export default function SleepModeButton() {
  const { active, endsAt } = useSleepMode();
  const remaining = useSleepRemaining();
  const [open, setOpen] = useState(false);
  const mins = endsAt && remaining > 0 ? Math.ceil(remaining / 60) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="잠자기 모드"
        className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
          active ? "text-[var(--star)]" : "text-muted hover:text-foreground"
        }`}
      >
        <Moon size={18} filled={active} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-2xl shadow-lg p-3.5 z-50">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Moon size={15} filled className="text-primary" />
              <p className="text-sm font-bold">잠자기 모드</p>
              {active && (
                <span className="ml-auto text-xs font-semibold text-muted tabular-nums">
                  {mins ? `${mins}분 남음` : "켜짐"}
                </span>
              )}
            </div>

            {active ? (
              <div className="flex gap-2">
                <button
                  onClick={() => extendSleepTimer(15)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold bg-surface-soft text-foreground/80 hover:bg-primary-light transition"
                >
                  +15분
                </button>
                <button
                  onClick={() => {
                    stopSleepMode();
                    setOpen(false);
                  }}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition"
                >
                  끄기
                </button>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-muted mb-2.5 leading-relaxed">
                  화면이 밤 색으로 바뀌고, 정한 시간 동안 포근하게 잠들 수 있어요
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        startSleepTimer(m);
                        setOpen(false);
                      }}
                      className="py-2 rounded-lg text-sm font-bold tabular-nums bg-surface-soft text-foreground/80 hover:bg-primary hover:text-white transition"
                    >
                      {m}분
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
