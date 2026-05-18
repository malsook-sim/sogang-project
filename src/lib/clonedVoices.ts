import type { Voice } from "@/data/voices";

const STORAGE_KEY = "myvoicestory.clonedVoices";

export interface ClonedVoice extends Voice {
  type: "cloned";
  createdAt: number;
}

export function getClonedVoices(): ClonedVoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClonedVoice[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addClonedVoice(input: {
  id: string;
  name: string;
  emoji?: string;
}): ClonedVoice {
  const voice: ClonedVoice = {
    id: input.id,
    name: input.name,
    description: "내가 직접 녹음한 목소리",
    emoji: input.emoji ?? "🎙️",
    type: "cloned",
    createdAt: Date.now(),
  };
  const list = getClonedVoices();
  const next = [voice, ...list.filter((v) => v.id !== voice.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return voice;
}

export function removeClonedVoice(id: string) {
  const next = getClonedVoices().filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
