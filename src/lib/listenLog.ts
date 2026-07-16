// 잠자리 루틴 기록 — 동화를 끝까지 들은 날을 localStorage에 남긴다.
// (서버 없이도 "이번 주 며칠째", 내 서재 캘린더 점을 만들 수 있음)

const KEY = "mvk.listenLog";

export interface ListenEntry {
  date: string; // YYYY-MM-DD (로컬)
  storyId: string;
  title: string;
  voiceName?: string;
  ts: number;
}

function load(): ListenEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function save(list: ListenEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-400)));
  } catch {
    // 저장 실패 무시
  }
}

export function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 이번 주 시작(월요일 00:00)
function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // 월=0 … 일=6
  x.setDate(x.getDate() - dow);
  return x;
}

// 이번 주에 동화를 들은 서로 다른 날 수
function weekCount(list: ListenEntry[], now: Date): number {
  const start = weekStart(now).getTime();
  const days = new Set<string>();
  for (const e of list) if (e.ts >= start) days.add(e.date);
  return days.size;
}

// 오늘부터 거슬러 이어진 연속 청취 일수 (오늘 포함)
function streakDays(list: ListenEntry[], now: Date): number {
  const dates = new Set(list.map((e) => e.date));
  let streak = 0;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while (dates.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export interface ListenRecord {
  weekCount: number; // 이번 주 며칠째
  streak: number; // 연속 일수 (오늘 포함)
  isFirstEver: boolean; // 생애 첫 기록인지
}

// 동화 완청 기록 → 기록 요약 반환
export function recordListen(
  storyId: string,
  title: string,
  voiceName?: string
): ListenRecord {
  const now = new Date();
  const list = load();
  const isFirstEver = list.length === 0;
  list.push({ date: dateKey(now), storyId, title, voiceName, ts: now.getTime() });
  save(list);
  return {
    weekCount: weekCount(list, now),
    streak: streakDays(list, now),
    isFirstEver,
  };
}

// 지금까지 들은 적 있는 동화 id 집합 (다음 편 추천 시 제외용)
export function getListenedStoryIds(): Set<string> {
  return new Set(load().map((e) => e.storyId));
}

// 이번 달 동화를 들은 서로 다른 날 수
export function thisMonthCount(): number {
  const now = new Date();
  const days = new Set<string>();
  for (const e of load()) {
    const d = new Date(e.ts);
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth())
      days.add(e.date);
  }
  return days.size;
}

// 특정 날짜에 들은 기록들 (내 서재 캘린더 팝오버)
export function listensOn(date: string): ListenEntry[] {
  return load()
    .filter((e) => e.date === date)
    .sort((a, b) => b.ts - a.ts);
}

// 들은 날짜 집합 (내 서재 캘린더 점)
export function getListenDates(): Set<string> {
  return new Set(load().map((e) => e.date));
}

// 이번 주 월~일 7칸 [{date, listened}]
export function thisWeekDots(): { date: string; listened: boolean }[] {
  const now = new Date();
  const start = weekStart(now);
  const dates = getListenDates();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date: dateKey(d), listened: dates.has(dateKey(d)) };
  });
}
