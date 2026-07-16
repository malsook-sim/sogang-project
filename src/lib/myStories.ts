import { useSyncExternalStore } from "react";
import type { Story } from "@/data/stories";

export interface GeneratedStory {
  title: string;
  content: string;
  contentKo?: string;
  morals: string[];
  moralSummary?: string;
  ageMin: number;
  ageMax: number;
  episodeSummary?: string | null; // 후속편 문맥용 요약(생성 시 함께 받음)
  newFacts?: string[]; // 이 편에서 새로 생긴 사실
}

export interface MyStory extends Story {
  createdAt: number;
}

const EMPTY: MyStory[] = [];

let stories: MyStory[] = EMPTY;
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
    const res = await fetch("/api/my-stories");
    const data = res.ok ? await res.json() : { stories: [] };
    stories = Array.isArray(data.stories) ? data.stories : [];
  } catch {
    stories = [];
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

function getSnapshot(): MyStory[] {
  return stories;
}

function getServerSnapshot(): MyStory[] {
  return EMPTY;
}

export function useMyStories(): MyStory[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// 같은 시리즈의 편들을 편 번호 순으로 (단독 동화면 빈 배열)
export function seriesEpisodes(all: MyStory[], seriesId?: string | null): MyStory[] {
  if (!seriesId) return [];
  return all
    .filter((s) => s.seriesId === seriesId)
    .sort((a, b) => (a.episodeNo ?? 1) - (b.episodeNo ?? 1));
}

export async function saveMyStory(
  input: GeneratedStory,
  // 이어 만들기: 직전 편 id("my-N") — 시리즈 필드는 서버에서 계산
  parentStoryId?: string | null
): Promise<MyStory | null> {
  try {
    const res = await fetch("/api/my-stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, parentStoryId: parentStoryId ?? null }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const story = data.story as MyStory;
    stories = [story, ...stories];
    emit();
    return story;
  } catch {
    return null;
  }
}

export async function renameMyStory(id: string, title: string): Promise<void> {
  const prev = stories;
  // 낙관적 업데이트
  stories = stories.map((s) => (s.id === id ? { ...s, title } : s));
  emit();

  try {
    const res = await fetch(`/api/my-stories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("rename failed");
  } catch {
    stories = prev;
    emit();
  }
}

export async function editMyStory(
  id: string,
  title: string,
  content: string
): Promise<boolean> {
  const prev = stories;
  stories = stories.map((s) => (s.id === id ? { ...s, title, content } : s));
  emit();
  try {
    const res = await fetch(`/api/my-stories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) throw new Error("edit failed");
    return true;
  } catch {
    stories = prev;
    emit();
    return false;
  }
}

export async function removeMyStory(id: string): Promise<void> {
  const prev = stories;
  // 낙관적 업데이트
  stories = stories.filter((s) => s.id !== id);
  emit();

  try {
    const res = await fetch(`/api/my-stories/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete failed");
  } catch {
    stories = prev;
    emit();
  }
}
