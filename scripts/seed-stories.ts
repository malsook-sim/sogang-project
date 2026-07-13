// 기본 동화 카탈로그를 stories 테이블에 시드 — 실행: npm run db:seed
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import { stories as baseStories } from "../src/data/stories";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

interface SeedStory {
  id: string;
  title: string;
  content: string;
  contentKo?: string;
  ageMin: number;
  ageMax: number;
  morals: string[];
  moralSummary?: string;
  isPremium: boolean;
  category: string;
  durationMin: number;
}

// 동화별 권장 연령 — 나이대 필터가 골고루 나뉘도록 분류
// (3~5세 / 5~7세 / 6~8세 세 묶음)
const AGE_OVERRIDES: Record<string, [number, number]> = {
  "1": [3, 5], "6": [3, 5], "8": [3, 5], "9": [3, 5], "18": [3, 5],
  "19": [3, 5], "20": [3, 5], "21": [3, 5], "25": [3, 5], "26": [3, 5],
  "27": [3, 5], "32": [3, 5], "33": [3, 5],
  "2": [5, 7], "3": [5, 7], "4": [5, 7], "11": [5, 7], "12": [5, 7],
  "15": [5, 7], "16": [5, 7], "24": [5, 7], "28": [5, 7], "30": [5, 7],
  "34": [5, 7],
  "5": [6, 8], "7": [6, 8], "10": [6, 8], "13": [6, 8], "14": [6, 8],
  "17": [6, 8], "22": [6, 8], "23": [6, 8], "29": [6, 8], "31": [6, 8],
};

async function main() {
  const env = await readFile(join(root, ".env.local"), "utf8");
  const rawUrl = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();
  if (!rawUrl) throw new Error(".env.local 에 DATABASE_URL 이 없습니다.");

  const newRaw = await readFile(join(root, "db", "new-stories.json"), "utf8");
  const newStories = JSON.parse(newRaw) as SeedStory[];

  const engRaw = await readFile(
    join(root, "db", "english-stories.json"),
    "utf8"
  );
  const englishStories = JSON.parse(engRaw) as SeedStory[];

  // 영어동화 한글 번역 붙이기
  const transRaw = await readFile(
    join(root, "db", "english-translations.json"),
    "utf8"
  );
  const translations = JSON.parse(transRaw) as {
    id: string;
    contentKo: string;
  }[];
  const transMap = new Map(translations.map((t) => [t.id, t.contentKo]));
  for (const s of englishStories) {
    s.contentKo = transMap.get(s.id);
  }

  const all: SeedStory[] = [
    ...(baseStories as SeedStory[]),
    ...newStories,
    ...englishStories,
  ];

  // 교훈 캡션(moral_summary) — id 기준으로 한 파일에서 관리
  const summaryRaw = await readFile(
    join(root, "db", "moral-summaries.json"),
    "utf8"
  );
  const moralSummaries = JSON.parse(summaryRaw) as Record<string, string>;

  // 권장 연령 재분류 적용
  for (const s of all) {
    const o = AGE_OVERRIDES[s.id];
    if (o) {
      s.ageMin = o[0];
      s.ageMax = o[1];
    }
  }

  const conn = await mysql.createConnection(rawUrl);

  // 기존 재생수는 보존
  const [prevRows] = await conn.query<RowDataPacket[]>(
    "SELECT id, play_count FROM stories"
  );
  const prevPlayCount = new Map(
    prevRows.map((r) => [String(r.id), Number(r.play_count)])
  );

  await conn.query("DELETE FROM stories");

  for (const s of all) {
    await conn.query(
      `INSERT INTO stories
         (id, title, content, content_ko, age_min, age_max, morals, moral_summary,
          is_premium, category, duration_min, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.title,
        s.content,
        s.contentKo ?? null,
        s.ageMin,
        s.ageMax,
        JSON.stringify(s.morals),
        moralSummaries[s.id] ?? s.moralSummary ?? null,
        s.isPremium ? 1 : 0,
        s.category,
        s.durationMin,
        Number(s.id),
      ]
    );
  }

  // 재생수 복원
  for (const [id, pc] of prevPlayCount) {
    if (pc > 0) {
      await conn.query("UPDATE stories SET play_count = ? WHERE id = ?", [
        pc,
        id,
      ]);
    }
  }

  console.log(`동화 ${all.length}편 시드 완료`);
  await conn.end();
}

main().catch((err) => {
  console.error("시드 실패:", err.message);
  process.exit(1);
});
