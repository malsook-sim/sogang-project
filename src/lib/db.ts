import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
};

export const db =
  globalForDb.mysqlPool ??
  mysql.createPool(process.env.DATABASE_URL as string);

if (process.env.NODE_ENV !== "production") {
  globalForDb.mysqlPool = db;
}
