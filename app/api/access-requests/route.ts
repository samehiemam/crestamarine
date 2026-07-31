import type { ResultSetHeader } from "mysql2";
import { getPool, hasDatabase } from "../../../db/mysql";
import { getChatGPTUser } from "../../chatgpt-auth";
import {
  ensureUsersTable,
  isAdminEmail,
  listAccessUsers,
} from "../../../db/users";
import type { UserRole, UserStatus } from "../../../db/users";

type AccessRequestPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  company?: string;
  message?: string;
  source?: string;
  website?: string;
};

type ReviewPayload = {
  id?: string;
  status?: string;
};

const validRoles = new Set<UserRole>(["client", "employee", "ambassador"]);
const validStatuses = new Set<UserStatus>(["approved", "rejected"]);

export async function POST(request: Request) {
  const payload = (await request.json()) as AccessRequestPayload;
  if (payload.website) {
    return Response.json({ ok: true });
  }

  const fullName = String(payload.fullName ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const phone = String(payload.phone ?? "").trim();
  const role = String(payload.role ?? "") as UserRole;
  const company = String(payload.company ?? "").trim();
  const message = String(payload.message ?? "").trim();
  const source = String(payload.source ?? "website").trim();

  if (
    fullName.length < 2 ||
    !email.includes("@") ||
    phone.length < 7 ||
    !validRoles.has(role)
  ) {
    return Response.json(
      { error: "Please complete all required fields." },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const db = getPool();
  if (db) {
    await ensureUsersTable();
    await db.execute(
      `INSERT INTO users (
        id, email, full_name, phone, requested_role, approved_role,
        company, message, auth_provider, status, source, created_at,
        updated_at, reviewed_at, reviewed_by
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NULL, 'pending', ?, ?, ?, NULL, NULL)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        phone = VALUES(phone),
        requested_role = VALUES(requested_role),
        company = VALUES(company),
        message = VALUES(message),
        status = 'pending',
        source = VALUES(source),
        updated_at = VALUES(updated_at),
        reviewed_at = NULL,
        reviewed_by = NULL`, [
        id,
        email,
        fullName,
        phone,
        role,
        company || null,
        message || null,
        source,
        now,
        now,
      ]);
  }

  const notificationSent = await notifyAdmin({
    id,
    fullName,
    email,
    phone,
    role,
    company,
    message,
    origin: new URL(request.url).origin,
  });

  return Response.json({
    ok: true,
    requestId: id,
    status: "pending",
    notificationSent,
    preview: !hasDatabase(),
  });
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user || !isAdminEmail(user.email)) {
    return Response.json({ error: "Not authorised" }, { status: 403 });
  }

  return Response.json({ users: await listAccessUsers() });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  const db = getPool();
  if (!user || !isAdminEmail(user.email) || !db) {
    return Response.json({ error: "Not authorised" }, { status: 403 });
  }

  const payload = (await request.json()) as ReviewPayload;
  const id = String(payload.id ?? "");
  const status = String(payload.status ?? "") as UserStatus;
  if (!id || !validStatuses.has(status)) {
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
     WHERE id = ?`,
    [status, status, reviewedAt, user.email, reviewedAt, id],
  );

  if (!result.affectedRows) {
    return Response.json({ error: "Request not found" }, { status: 404 });
  }

  return Response.json({ ok: true, id, status });
}

async function notifyAdmin(input: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  company: string;
  message: string;
  origin: string;
}) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return false;

  const recipient =
    process.env.ADMIN_NOTIFICATION_EMAIL ?? "admin@crestamarine.com";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [recipient],
      subject: `Cresta ${input.role} access request — ${input.fullName}`,
      text: [
        `A new ${input.role} access request is ready for review.`,
        "",
        `Name: ${input.fullName}`,
        `Email: ${input.email}`,
        `Phone: ${input.phone}`,
        `Company / department: ${input.company || "Not provided"}`,
        `Message: ${input.message || "Not provided"}`,
        `Request ID: ${input.id}`,
        "",
        `Review: ${input.origin}/admin/access-requests`,
      ].join("\n"),
    }),
  });

  return response.ok;
}
