import { useSyncExternalStore } from "react";
import type { Story } from "@/data/stories";

const EMPTY: Story[] = [];
const MAX_ATTEMPTS = 4; // 초기 시도 + 재시도 (0.5s, 1s, 2s 백오프)

let catalog: Story[] = EMPTY;
let loaded = false; // 성공적으로 한 번이라도 불러왔는지 (에러로는 true가 되지 않음)
let loading = false;
let error = false; // 재시도 소진 후에도 실패 → 에러 UI 노출용
let attempts = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

// 한 번의 시도. 실패하면 백오프 후 스스로 재시도하고,
// 재시도를 소진해도 loaded는 false로 유지해 "빈 홈 박제"를 막는다.
async function attempt() {
  loading = true;
  error = false;
  emit();
  try {
    const res = await fetch("/api/stories");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    catalog = Array.isArray(data.stories) ? data.stories : [];
    loaded = true;
    loading = false;
    error = false;
    attempts = 0;
    emit();
  } catch {
    attempts += 1;
    if (attempts < MAX_ATTEMPTS) {
      // loading=true 유지(중복 로드 차단) 후 지수 백오프 재시도
      const delay = 500 * 2 ** (attempts - 1);
      setTimeout(attempt, delay);
    } else {
      loading = false;
      error = true; // loaded는 false 유지 → 재시도 가능
      emit();
    }
  }
}

function load() {
  if (loading || loaded) return;
  attempts = 0;
  attempt();
}

// 에러 상태에서 사용자가 수동으로 다시 시도
export function retryCatalog() {
  if (loading) return;
  loaded = false;
  error = false;
  attempts = 0;
  attempt();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (!loaded && !loading) load();
  return () => {
    listeners.delete(callback);
  };
}

// 기본 동화 카탈로그 (DB의 stories 테이블). 앱 실행 중 한 번만 불러와 캐시.
export function useCatalog(): Story[] {
  return useSyncExternalStore(subscribe, () => catalog, () => EMPTY);
}

// 로딩 완료 여부 (성공 로드 시에만 true) — 로딩 중 vs 빈 상태 구분용
export function useCatalogLoaded(): boolean {
  return useSyncExternalStore(subscribe, () => loaded, () => false);
}

// 로딩 중 여부 — 스켈레톤 노출용
export function useCatalogLoading(): boolean {
  return useSyncExternalStore(subscribe, () => loading, () => false);
}

// 재시도 소진 후 실패 여부 — 에러 UI 노출용
export function useCatalogError(): boolean {
  return useSyncExternalStore(subscribe, () => error, () => false);
}
