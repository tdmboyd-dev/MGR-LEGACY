import type { SqlExecutor } from "./sql.js";

export interface IdempotencyRecord {
  tenantId: string;
  key: string;
  commandId: string;
  response?: unknown;
}

export class PostgresIdempotencyStore {
  constructor(private readonly db: SqlExecutor) {}

  async get(tenantId: string, key: string): Promise<IdempotencyRecord | null> {
    const result = await this.db.query<{
      tenant_id:string; idempotency_key:string; command_id:string; response:unknown;
    }>(
      "SELECT tenant_id, idempotency_key, command_id, response FROM idempotency_keys WHERE tenant_id = $1 AND idempotency_key = $2",
      [tenantId, key]
    );
    const row = result.rows[0];
    return row ? { tenantId:row.tenant_id, key:row.idempotency_key, commandId:row.command_id, response:row.response } : null;
  }

  async reserve(tenantId: string, key: string, commandId: string): Promise<boolean> {
    const result = await this.db.query(
      `INSERT INTO idempotency_keys (tenant_id, idempotency_key, command_id)
       VALUES ($1,$2,$3)
       ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
       RETURNING idempotency_key`,
      [tenantId, key, commandId]
    );
    return result.rowCount === 1;
  }

  async complete(tenantId: string, key: string, response: unknown): Promise<void> {
    await this.db.query(
      "UPDATE idempotency_keys SET response = $3::jsonb WHERE tenant_id = $1 AND idempotency_key = $2",
      [tenantId, key, JSON.stringify(response)]
    );
  }
}
