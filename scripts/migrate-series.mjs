// user_stories 시리즈(이어 만들기) 컬럼 추가 마이그레이션. 로컬 DB에 1회 실행.
// series_id = 1편의 user_stories.id (BIGINT 자기참조). uuid 대신 기존 id 재사용.
import fs from "node:fs";
import mysql from "mysql2/promise";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const c = await mysql.createConnection(env.DATABASE_URL);

const COLS = [
  ["series_id", "BIGINT UNSIGNED NULL"],
  ["series_title", "VARCHAR(200) NULL"],
  ["episode_no", "INT UNSIGNED NOT NULL DEFAULT 1"],
  ["parent_story_id", "BIGINT UNSIGNED NULL"],
  ["episode_summary", "TEXT NULL"],
  ["new_facts", "JSON NULL"],
];

for (const [name, def] of COLS) {
  const [rows] = await c.query(
    "SELECT COUNT(*) n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_stories' AND column_name = ?",
    [name]
  );
  if (rows[0].n > 0) { console.log(`= ${name} 이미 있음, 건너뜀`); continue; }
  await c.query(`ALTER TABLE user_stories ADD COLUMN ${name} ${def}`);
  console.log(`+ ${name} 추가됨`);
}

// 시리즈 조회용 인덱스
const [idx] = await c.query(
  "SELECT COUNT(*) n FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'user_stories' AND index_name = 'idx_user_stories_series'"
);
if (idx[0].n === 0) {
  await c.query("ALTER TABLE user_stories ADD KEY idx_user_stories_series (user_id, series_id, episode_no)");
  console.log("+ idx_user_stories_series 인덱스 추가됨");
}

const [check] = await c.query("SHOW COLUMNS FROM user_stories");
console.log("\n현재 user_stories 컬럼:", check.map((r) => r.Field).join(", "));
await c.end();
