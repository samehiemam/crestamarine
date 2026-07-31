import { getPool, hasDatabase } from "../../../db/mysql";

type LeadPayload = {
  name?: string;
  email?: string;
  phone?: string;
  provider?: string;
  configuration?: unknown;
};

async function ensureTables() {
  const db = getPool();
  if (!db) return;

  await db.execute(
      `CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(64) NOT NULL,
        auth_provider VARCHAR(64),
        role VARCHAR(32) NOT NULL DEFAULT 'prospect',
        status VARCHAR(32) NOT NULL DEFAULT 'quote_requested',
        created_at VARCHAR(32) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );

  await db.execute(
      `CREATE TABLE IF NOT EXISTS boat_configurations (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        model VARCHAR(128) NOT NULL,
        configuration_json JSON NOT NULL,
        created_at VARCHAR(32) NOT NULL,
        FOREIGN KEY (lead_id) REFERENCES leads(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
}

export async function POST(request: Request) {
  const payload = (await request.json()) as LeadPayload;
  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const phone = String(payload.phone ?? "").trim();

  if (!name || !email || !phone || !payload.configuration) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const leadId = crypto.randomUUID();
  const configurationId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const configuration = payload.configuration as { model?: string };

  const db = getPool();
  if (db) {
    await ensureTables();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
          `INSERT INTO leads
           (id, name, email, phone, auth_provider, role, status, created_at)
           VALUES (?, ?, ?, ?, ?, 'prospect', 'quote_requested', ?)`, [
          leadId,
          name,
          email,
          phone,
          String(payload.provider ?? ""),
          createdAt,
        ]);
      await connection.execute(
          `INSERT INTO boat_configurations
           (id, lead_id, model, configuration_json, created_at)
           VALUES (?, ?, ?, ?, ?)`, [
          configurationId,
          leadId,
          String(configuration.model ?? "Kumbra"),
          JSON.stringify(payload.configuration),
          createdAt,
        ]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  return Response.json({
    ok: true,
    leadId,
    configurationId,
    preview: !hasDatabase(),
  });
}
