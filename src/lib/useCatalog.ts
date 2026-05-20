import { useSyncExternalStore } from "react";
import type { Story } from "@/data/stories";

const EMPTY: Story[] = [];

let catalog: Story[] = EMPTY;
let loaded = false;
let loading = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

async function load() {
  if (loading) return;
  loading = true;
  try {
    const res = await fetch("/api/stories");
    const data = res.ok ? await res.json() : { stories: [] };
    catalog = Array.isArray(data.stories) ? data.stories : [];
  } catch {
    catalog = [];
  }
  loaded = true;
  loading = false;
  emit();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (!loaded) load();
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Story[] {
  return catalog;
}

function getServerSnapshot(): Story[] {
  return EMPTY;
}

// 기본 동화 카탈로그 (DB의 stories 테이블). 앱 실행 중 한 번만 불러와 캐시.
export function useCatalog(): Story[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// 카탈로그 로딩 완료 여부 (로딩 중 vs 빈 상태 구분용)
export function useCatalogLoaded(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => loaded,
    () => false
  );
}
