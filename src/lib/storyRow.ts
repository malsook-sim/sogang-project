import type { RowDataPacket } from "mysql2";
import type { Story } from "@/data/stories";

export function parseMorals(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function rowToCatalogStory(r: RowDataPacket): Story {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    contentKo: r.content_ko ?? undefined,
    ageMin: r.age_min,
    ageMax: r.age_max,
    morals: parseMorals(r.morals),
    isPremium: Boolean(r.is_premium),
    category: r.category,
    durationMin: r.duration_min,
    playCount: r.play_count ?? 0,
  };
}

export function rowToMyStory(r: RowDataPacket): Story & { createdAt: number } {
  return {
    id: `my-${r.id}`,
    title: r.title,
    content: r.content,
    contentKo: r.content_ko ?? undefined,
    thumbnailUrl: "",
    ageMin: r.age_min,
    ageMax: r.age_max,
    morals: parseMorals(r.morals),
    isPremium: false,
    category: "custom",
    durationMin: r.duration_min,
    createdAt: Number(r.created_at) * 1000,
  };
}
