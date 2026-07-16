import type { RowDataPacket } from "mysql2";
import type { Story } from "@/data/stories";
import { estimateDuration } from "@/lib/duration";

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

// new_facts(JSON 배열) → 문자열 배열. 문자열 항목만, 최대 8개.
export function parseFacts(value: unknown): string[] {
  const arr = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? (() => {
        try {
          const p = JSON.parse(value);
          return Array.isArray(p) ? p : [];
        } catch {
          return [];
        }
      })()
    : [];
  return arr
    .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
    .map((f) => f.trim())
    .slice(0, 8);
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
    moralSummary: r.moral_summary ?? undefined,
    isPremium: Boolean(r.is_premium),
    category: r.category,
    durationMin: estimateDuration(r.content),
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
    moralSummary: r.moral_summary ?? undefined,
    isPremium: false,
    category: "custom",
    durationMin: estimateDuration(r.content),
    seriesId: r.series_id != null ? `my-${r.series_id}` : null,
    seriesTitle: r.series_title ?? null,
    episodeNo: r.episode_no ?? 1,
    parentStoryId: r.parent_story_id != null ? `my-${r.parent_story_id}` : null,
    episodeSummary: r.episode_summary ?? null,
    newFacts: parseFacts(r.new_facts),
    createdAt: Number(r.created_at) * 1000,
  };
}
