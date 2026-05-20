// DB 스키마 적용 스크립트 — 실행: npm run db:setup
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const env = await readFile(join(root, ".env.local"), "utf8");
  const rawUrl = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();
  if (!rawUrl) throw new Error(".env.local 에 DATABASE_URL 이 없습니다.");

  const url = new URL(rawUrl);
  const schema = await readFile(join(root, "db", "schema.sql"), "utf8");

  // 데이터베이스 생성 전이라 DB 미지정으로 접속
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    multipleStatements: true,
  });
  console.log(`MySQL 연결 성공 (${url.hostname}:${url.port})`);

  await conn.query(schema);
  console.log("스키마 적용 완료");

  const dbName = url.pathname.replace(/^\//, "");
  const [tables] = await conn.query(
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name",
    [dbName]
  );
  console.log(`'${dbName}' 테이블:`, tables.map((t) => t.name).join(", "));

  await conn.end();
}

main().catch((err) => {
  console.error("DB 셋업 실패:", err.message);
  process.exit(1);
});
