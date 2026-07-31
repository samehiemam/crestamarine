import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

declare global {
  var crestaMysqlPool: Pool | undefined;
}

function databaseConfig() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  if (!host || !user || !password || !database) return null;

  return { host, port: Number(process.env.DB_PORT ?? 3306), user, password, database };
}

export function hasDatabase() {
  return databaseConfig() !== null;
}

export function getPool() {
  const config = databaseConfig();
  if (!config) return null;
  if (!global.crestaMysqlPool) {
    global.crestaMysqlPool = mysql.createPool({
      ...(typeof config === "string" ? { uri: config } : config),
      connectionLimit: 5,
      enableKeepAlive: true,
      charset: "utf8mb4",
    });
  }
  return global.crestaMysqlPool;
}

export async function rows<T extends RowDataPacket>(sql: string, values: unknown[] = []) {
  const pool = getPool();
  if (!pool) return [] as T[];
  const [result] = await pool.execute<T[]>(sql, values);
  return result;
}
