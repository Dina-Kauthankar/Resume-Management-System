import mysql from "mysql2/promise";

const globalForMysql = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "resume_db",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export const db =
  globalForMysql.mysqlPool ??
  createPool();

if (process.env.NODE_ENV !== "production") {
  globalForMysql.mysqlPool = db;
}
