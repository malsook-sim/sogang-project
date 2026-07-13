// 목소리 관계(대상자) 정의 — 라벨/기본 이름/이모지(DB 저장값)/아바타 색상
export interface Relationship {
  id: string;
  label: string;
  emoji: string;
  name: string;
  color: string;
}

export const RELATIONSHIPS: Relationship[] = [
  { id: "mom", label: "엄마", emoji: "👩", name: "엄마 목소리", color: "#F0A48A" },
  { id: "dad", label: "아빠", emoji: "👨", name: "아빠 목소리", color: "#7BA7D9" },
  { id: "grandma", label: "할머니", emoji: "👵", name: "할머니 목소리", color: "#C9A0DC" },
  { id: "grandpa", label: "할아버지", emoji: "👴", name: "할아버지 목소리", color: "#9BB89B" },
  { id: "bro", label: "오빠", emoji: "👦", name: "오빠 목소리", color: "#7FC8C0" },
  { id: "sis", label: "언니", emoji: "👧", name: "언니 목소리", color: "#EDA0B8" },
  { id: "etc", label: "기타", emoji: "🎙️", name: "내 목소리", color: "#B3AECB" },
];

const DEFAULT_COLOR = "#B3AECB";
const byEmoji = new Map(RELATIONSHIPS.map((r) => [r.emoji, r]));

// 저장된 이모지 → 아바타 배경색 (미매칭·기타는 회보라)
export function voiceColor(emoji?: string | null): string {
  if (!emoji) return DEFAULT_COLOR;
  return byEmoji.get(emoji)?.color ?? DEFAULT_COLOR;
}
