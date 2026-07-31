import type { ResultSetHeader } from "mysql2";
import { getPool } from "../../../db/mysql";
import { getChatGPTUser } from "../../chatgpt-auth";
import {
  canManageAccounts,
  ensureUsersTable,
  getAccessUserByEmail,
  listManagedAccounts,
  type UserRole,
  type UserStatus,
} from "../../../db/users";

type CreateAccountPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  company?: string;
};

type ReviewAccountPayload = {
  id?: string;
  status?: string;
};

const managedRoles = new Set<UserRole>(["client", "ambassador"]);
const reviewStatuses = new Set<UserStatus>(["approved", "rejected"]);

async function requireManager() {
  const user = await getChatGPTUser();
  if (!user || !(await canManageAccounts(user.email))) return null;
  return user;
}

export async function GET() {
  const manager = await requireManager();
  if (!manager) {
    return Response.json({ error: "Not authorised" }, { status: 403 });
  }

  return Response.json({ users: await listManagedAccounts() });
}

export async function POST(request: Request) {
  const manager = await requireManager();
  const db = getPool();
  if (!manager || !db) {
    return Response.json({ error: "Not authorised" }, { status: 403 });
  }

  const payload = (await request.json()) as CreateAccountPayload;
  const fullName = String(payload.fullName ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const phone = String(payload.phone ?? "").trim();
  const role = String(payload.role ?? "") as UserRole;
  const company = String(payload.company ?? "").trim();

  if (
    fullName.length < 2 ||
    !email.includes("@") ||
    phone.length < 7 ||
    !managedRoles.has(role)
  ) {
    return Response.json(
      { error: "Please complete all required fields." },
      { status: 400 },
    );
  }

  await ensureUsersTable();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO users (
      id, email, full_name, phone, requested_role, approved_role,
      company, message, auth_provider, status, source, created_at,
      updated_at, reviewed_at, reviewed_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'approved', 'employee_portal', ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      full_name = VALUES(full_name),
      phone = VALUES(phone),
      requested_role = VALUES(requested_role),
      approved_role = VALUES(approved_role),
      company = VALUES(company),
      status = 'approved',
      source = VALUES(source),
      updated_at = VALUES(updated_at),
      reviewed_at = VALUES(reviewed_at),
      reviewed_by = VALUES(reviewed_by)`, [
      id,
      email,
      fullName,
      phone,
      role,
      role,
      company || null,
      now,
      now,
      now,
      manager.email,
    ]);

  const account = await getAccessUserByEmail(email);
  return Response.json({ ok: true, user: account }, { status: 201 });
}

export async function PATCH(request: Request) {
  const manager = await requireManager();
  const db = getPool();
  if (!manager || !db) {
    return Response.json({ error: "Not authorised" }, { status: 403 });
  }

  const payload = (await request.json()) as ReviewAccountPayload;
  const id = String(payload.id ?? "");
  const status = String(payload.status ?? "") as UserStatus;
  if (!id || !reviewStatuses.has(status)) {
    return Response.json({ error: "Invalid review request" }, { status: 400 });
  }

  await ensureUsersTable();
  const reviewedAt = new Date().toISOString();
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE users
     SET
       status = ?,
       approved_role = CASE WHEN ? = 'approved' THEN requested_role ELSE NULL END,
       reviewed_at = ?,
       reviewed_by = ?,
       updated_at = ?
     WHERE id = ?
       AND requested_role = 'ambassador'`,
    [status, status, reviewedAt, manager.email, reviewedAt, id],
  );

  if (!result.affectedRows) {
    return Response.json(
      { error: "Ambassador application not found" },
      { status: 404 },
    );
  }

  const account = (await listManagedAccounts()).find((user) => user.id === id);
  return Response.json({ ok: true, user: account });
}
