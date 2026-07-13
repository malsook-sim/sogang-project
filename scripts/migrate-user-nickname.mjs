// users 테이블에 nickname / privacy_agreed_at 컬럼 추가 (없을 때만). 비파괴적.
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env
  .split(/\r?\n/)
  .find((l) => l.startsWith("DATABASE_URL="))
  .slice("DATABASE_URL=".length)
  .trim();

const dbName = new URL(url).pathname.replace(/^\//, "");
const conn = await mysql.createConnection(url);

async function hasColumn(col) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = ? AND table_name = 'users' AND column_name = ? LIMIT 1`,
    [dbName, col]
  );
  return rows.length > 0;
}

if (await hasColumn("nickname")) {
  console.log("SKIP nickname (이미 있음)");
} else {
  await conn.query(
    "ALTER TABLE users ADD COLUMN nickname VARCHAR(50) NULL AFTER password_hash"
  );
  console.log("OK  nickname 추가");
}

if (await hasColumn("privacy_agreed_at")) {
  console.log("SKIP privacy_agreed_at (이미 있음)");
} else {
  await conn.query(
    "ALTER TABLE users ADD COLUMN privacy_agreed_at TIMESTAMP NULL AFTER default_voice_id"
  );
  console.log("OK  privacy_agreed_at 추가");
}

await conn.end();
console.log("완료");
