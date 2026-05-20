// 기본 동화 카탈로그를 stories 테이블에 시드 — 실행: npm run db:seed
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";
import { stories as baseStories } from "../src/data/stories";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

interface SeedStory {
  id: string;
  title: string;
  content: string;
  ageMin: number;
  ageMax: number;
  morals: string[];
  isPremium: boolean;
  category: string;
  durationMin: number;
}

async function main() {
  const env = await readFile(join(root, ".env.local"), "utf8");
  const rawUrl = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();
  if (!rawUrl) throw new Error(".env.local 에 DATABASE_URL 이 없습니다.");

  const newRaw = await readFile(join(root, "db", "new-stories.json"), "utf8");
  const newStories = JSON.parse(newRaw) as SeedStory[];

  const all: SeedStory[] = [...(baseStories as SeedStory[]), ...newStories];

  const conn = await mysql.createConnection(rawUrl);
  await conn.query("DELETE FROM stories");

  for (const s of all) {
    await conn.query(
      `INSERT INTO stories
         (id, title, content, age_min, age_max, morals, is_premium,
          category, duration_min, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.title,
        s.content,
        s.ageMin,
        s.ageMax,
        JSON.stringify(s.morals),
        s.isPremium ? 1 : 0,
        s.category,
        s.durationMin,
        Number(s.id),
      ]
    );
  }

  console.log(`동화 ${all.length}편 시드 완료`);
  await conn.end();
}

main().catch((err) => {
  console.error("시드 실패:", err.message);
  process.exit(1);
});
