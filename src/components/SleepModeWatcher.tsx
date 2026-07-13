"use client";

import { useEffect } from "react";
import { hydrateSleepMode, settleTimer, useSleepMode } from "@/lib/sleepMode";

// 앱 어디서나(플레이어 포함) 항상 마운트되어 타이머 만료를 감지.
// 만료 시 밤 테마는 유지한 채 타이머만 정리 → 인디케이터 카운트다운 종료.
export default function SleepModeWatcher() {
  const { endsAt } = useSleepMode();

  useEffect(() => {
    hydrateSleepMode();
  }, []);

  useEffect(() => {
    if (!endsAt) return;
    const check = () => {
      if (Date.now() >= endsAt) settleTimer();
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return null;
}
