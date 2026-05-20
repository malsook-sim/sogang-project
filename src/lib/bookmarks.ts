import { useSyncExternalStore } from "react";

const EMPTY: string[] = [];

let ids: string[] = EMPTY;
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
    const res = await fetch("/api/bookmarks");
    const data = res.ok ? await res.json() : { storyIds: [] };
    ids = Array.isArray(data.storyIds) ? data.storyIds : [];
  } catch {
    ids = [];
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

function getSnapshot(): string[] {
  return ids;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

export function useBookmarks(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export async function toggleBookmark(id: string): Promise<boolean> {
  const exists = ids.includes(id);
  // 낙관적 업데이트
  ids = exists ? ids.filter((x) => x !== id) : [id, ...ids];
  emit();

  try {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: id }),
    });
    if (!res.ok) throw new Error("bookmark failed");
  } catch {
    // 실패 시 롤백
    ids = exists
      ? [id, ...ids.filter((x) => x !== id)]
      : ids.filter((x) => x !== id);
    emit();
  }

  return !exists;
}
