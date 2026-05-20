import { useSyncExternalStore } from "react";
import type { Story } from "@/data/stories";

export interface GeneratedStory {
  title: string;
  content: string;
  morals: string[];
  ageMin: number;
  ageMax: number;
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

export async function saveMyStory(
  input: GeneratedStory
): Promise<MyStory | null> {
  try {
    const res = await fetch("/api/my-stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
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
