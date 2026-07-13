"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// 잠자기 타이머 / 밤(수면) 모드 전역 상태
//  active : 밤 테마 on/off (html.sleep-mode 클래스로 전역 반영)
//  endsAt : 타이머 종료 시각(ms). null = 진행 중 타이머 없음(테마만 유지될 수 있음)
export interface SleepState {
  active: boolean;
  endsAt: number | null;
}

const KEY = "mvk.sleepMode";
const DATE_KEY = "mvk.sleepModeDate";

let state: SleepState = { active: false, endsAt: null };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function applyClass() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("sleep-mode", state.active);
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    localStorage.setItem(DATE_KEY, todayStr());
  } catch {
    // 무시
  }
}

function commit(next: SleepState) {
  const themeChanged = state.active !== next.active;
  state = next;
  applyClass();
  // 밤 테마 on/off 전환 순간에만 1.2s 전환 클래스를 잠깐 걸어 부드럽게
  if (themeChanged && typeof document !== "undefined") {
    const el = document.documentElement;
    el.classList.add("theme-transition");
    window.setTimeout(() => el.classList.remove("theme-transition"), 1300);
  }
  save();
  emit();
}

// 앱 최초 진입 시 1회 복원 (새로고침 유지 + 날짜/타이머 만료 처리)
export function hydrateSleepMode() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const lastDate = localStorage.getItem(DATE_KEY);
    if (lastDate && lastDate !== todayStr()) {
      // 다음날 첫 방문 → 밤 테마 자동 해제
      localStorage.removeItem(KEY);
      localStorage.removeItem(DATE_KEY);
      state = { active: false, endsAt: null };
    } else {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as SleepState;
        state = { active: !!p.active, endsAt: p.endsAt ?? null };
        // 없는 사이 타이머가 만료됐으면 타이머만 해제(밤 테마는 유지)
        if (state.endsAt && state.endsAt <= Date.now()) state.endsAt = null;
      }
    }
  } catch {
    state = { active: false, endsAt: null };
  }
  applyClass();
  emit();
}

// --- actions ---
export function startSleepTimer(minutes: number) {
  commit({ active: true, endsAt: Date.now() + minutes * 60_000 });
}

export function extendSleepTimer(minutes: number) {
  const base =
    state.endsAt && state.endsAt > Date.now() ? state.endsAt : Date.now();
  commit({ active: true, endsAt: base + minutes * 60_000 });
}

// 사용자가 직접 끔 (밤 테마까지 완전 해제)
export function stopSleepMode() {
  commit({ active: false, endsAt: null });
}

// 타이머 만료: 타이머만 해제하고 밤 테마는 유지 (자는 방이 갑자기 밝아지면 안 됨)
export function settleTimer() {
  if (state.endsAt !== null) commit({ active: state.active, endsAt: null });
}

// --- subscription ---
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function getSnapshot() {
  return state;
}
const SERVER_STATE: SleepState = { active: false, endsAt: null };
function getServerSnapshot() {
  return SERVER_STATE;
}

export function useSleepMode(): SleepState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// 남은 초 (1초 틱). 타이머 없으면 0. (Date.now는 렌더 밖 틱에서만 호출)
export function useSleepRemaining(): number {
  const { endsAt } = useSleepMode();
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!endsAt) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return endsAt ? remaining : 0;
}
