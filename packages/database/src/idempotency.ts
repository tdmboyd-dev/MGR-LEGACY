import type { SqlExecutor } from "./sql.js";

export interface IdempotencyRecord {
  tenantId: string;
  key: string;
  commandId: string;
  response?: unknown;
  requestDigest?:string;
}

export class PostgresIdempotencyStore {
  constructor(private readonly db: SqlExecutor) {}

  async get(tenantId: string, key: string): Promise<IdempotencyRecord | null> {
    const result = await this.db.query<{
      tenant_id:string; idempotency_key:string; command_id:string; response:unknown; request_digest:string;
    }>(
      "SELECT tenant_id, idempotency_key, command_id, response, request_digest FROM idempotency_keys WHERE tenant_id = $1 AND idempotency_key = $2",
      [tenantId, key]
    );
    const row = result.rows[0];
    return row ? { tenantId:row.tenant_id, key:row.idempotency_key, commandId:row.command_id, response:row.response, requestDigest:row.request_digest } : null;
  }

  async reserve(tenantId: string, key: string, commandId: string, requestDigest?:string): Promise<boolean> {
    const result = await this.db.query(
      `INSERT INTO idempotency_keys (tenant_id, idempotency_key, command_id, request_digest)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
       RETURNING idempotency_key`,
      [tenantId, key, commandId, requestDigest ?? null]
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
