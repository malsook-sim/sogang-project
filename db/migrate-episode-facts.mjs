// user_stories 를 현재 schema.sql 수준으로 멱등하게 맞춘다.
// 시리즈 컬럼(series_id/series_title/episode_no/parent_story_id) + 후속편 문맥 컬럼
// (episode_summary/new_facts) + 시리즈 인덱스를 없으면 추가한다.
// 로컬/EC2 어디서든: node db/migrate-episode-facts.mjs
// DATABASE_URL 은 환경변수 우선, 없으면 프로젝트 루트의 .env.local 에서 읽는다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let url = process.env.DATABASE_URL;
if (!url) {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^DATABASE_URL=(.*)$/);
      if (m) url = m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
}
if (!url) {
  console.error("DATABASE_URL 을 찾을 수 없어요 (환경변수/.env.local).");
  process.exit(1);
}

// 원하는 컬럼 정의 (schema.sql 과 동일). 순서대로 없으면 추가.
const WANT = [
  ["series_id", "BIGINT UNSIGNED NULL"],
  ["series_title", "VARCHAR(200) NULL"],
  ["episode_no", "INT UNSIGNED NOT NULL DEFAULT 1"],
  ["parent_story_id", "BIGINT UNSIGNED NULL"],
  ["episode_summary", "TEXT NULL"],
  ["new_facts", "JSON NULL"],
];

const conn = await mysql.createConnection(url);
try {
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_stories'`
  );
  const have = new Set(cols.map((c) => c.COLUMN_NAME));
  const added = [];
  for (const [name, def] of WANT) {
    if (!have.has(name)) {
      await conn.query(`ALTER TABLE user_stories ADD COLUMN ${name} ${def}`);
      added.push(name);
    }
  }

  // 시리즈 조회 인덱스
  const [idx] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_stories'
        AND INDEX_NAME = 'idx_user_stories_series' LIMIT 1`
  );
  let idxAdded = false;
  if (idx.length === 0) {
    await conn.query(
      `ALTER TABLE user_stories
         ADD KEY idx_user_stories_series (user_id, series_id, episode_no)`
    );
    idxAdded = true;
  }

  if (added.length === 0 && !idxAdded) {
    console.log("✓ 이미 최신 — 변경 없음");
  } else {
    if (added.length) console.log("✓ 컬럼 추가:", added.join(", "));
    if (idxAdded) console.log("✓ 인덱스 추가: idx_user_stories_series");
  }
} finally {
  await conn.end();
}
