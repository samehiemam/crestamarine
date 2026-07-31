import type { RowDataPacket } from "mysql2";
import { getPool, rows } from "./mysql";

export type UserRole = "client" | "employee" | "ambassador";
export type UserStatus = "pending" | "approved" | "rejected";

export type AccessUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  requestedRole: UserRole;
  approvedRole: UserRole | null;
  company: string | null;
  message: string | null;
  authProvider: string | null;
  status: UserStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

type AccessUserRow = AccessUser & RowDataPacket;

export async function ensureUsersTable() {
  const pool = getPool();
  if (!pool) return;
  await pool.execute(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    requested_role VARCHAR(32) NOT NULL,
    approved_role VARCHAR(32), company VARCHAR(255), message TEXT,
    auth_provider VARCHAR(64), status VARCHAR(32) NOT NULL DEFAULT 'pending',
    source VARCHAR(64) NOT NULL, created_at VARCHAR(32) NOT NULL,
    updated_at VARCHAR(32) NOT NULL, reviewed_at VARCHAR(32), reviewed_by VARCHAR(255)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

export async function listAccessUsers(): Promise<AccessUser[]> {
  await ensureUsersTable();
  return rows<AccessUserRow>(
    `SELECT
      id,
      email,
      full_name AS fullName,
      phone,
      requested_role AS requestedRole,
      approved_role AS approvedRole,
      company,
      message,
      auth_provider AS authProvider,
      status,
      source,
      created_at AS createdAt,
      updated_at AS updatedAt,
      reviewed_at AS reviewedAt,
      reviewed_by AS reviewedBy
    FROM users
    ORDER BY
      CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      created_at DESC`,
  );
}

export async function listManagedAccounts(): Promise<AccessUser[]> {
  const users = await listAccessUsers();
  return users.filter(
    (user) =>
      user.requestedRole === "client" || user.requestedRole === "ambassador",
  );
}

export async function getAccessUserByEmail(
  email: string,
): Promise<AccessUser | null> {
  await ensureUsersTable();
  const result = await rows<AccessUserRow>(
    `SELECT
      id,
      email,
      full_name AS fullName,
      phone,
      requested_role AS requestedRole,
      approved_role AS approvedRole,
      company,
      message,
      auth_provider AS authProvider,
      status,
      source,
      created_at AS createdAt,
      updated_at AS updatedAt,
      reviewed_at AS reviewedAt,
      reviewed_by AS reviewedBy
    FROM users
    WHERE email = ?
    LIMIT 1`,
    [email.trim().toLowerCase()],
  );
  return result[0] ?? null;
}

export function isAdminEmail(email: string) {
  const configured = process.env.ADMIN_EMAILS ?? "admin@crestamarine.com";
  return configured
    .split(",")
    .map((value: string) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function canManageAccounts(email: string) {
  if (isAdminEmail(email)) return true;
  const accessUser = await getAccessUserByEmail(email);
  return (
    accessUser?.status === "approved" &&
    accessUser.approvedRole === "employee"
  );
}
