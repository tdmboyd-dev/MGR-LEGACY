import type {
  CutoverState,
  CutoverStateStore,
  ReconciliationTelemetry
} from "@mgr/legacy-adapters";
import type { SqlExecutor } from "./sql.js";

export class PostgresCutoverStateRepository implements CutoverStateStore {
  constructor(private readonly db:SqlExecutor){}

  async get(source:CutoverState["source"],entityType:string):Promise<CutoverState|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM cutover_state WHERE source=$1 AND entity_type=$2 LIMIT 1",
      [source,entityType]
    );
    const row=result.rows[0];
    return row ? {
      source:row.source,entityType:row.entity_type,readAuthority:row.read_authority,
      writeMode:row.write_mode,changedAt:new Date(row.changed_at).toISOString(),changedBy:row.changed_by
    } : null;
  }

  async save(state:CutoverState):Promise<void>{
    await this.db.query(
      `INSERT INTO cutover_state
       (source,entity_type,read_authority,write_mode,changed_at,changed_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (source,entity_type)
       DO UPDATE SET read_authority=EXCLUDED.read_authority,write_mode=EXCLUDED.write_mode,
       changed_at=EXCLUDED.changed_at,changed_by=EXCLUDED.changed_by`,
      [state.source,state.entityType,state.readAuthority,state.writeMode,state.changedAt,state.changedBy]
    );
  }
}

export class PostgresReconciliationTelemetryRepository {
  constructor(private readonly db:SqlExecutor){}

  async append(row:ReconciliationTelemetry):Promise<void>{
    await this.db.query(
      `INSERT INTO reconciliation_telemetry
       (source,entity_type,source_count,legacy_count,matched,mismatches,missing,duplicates,parity_percent,error_rate,observed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        row.source,row.entityType,row.sourceCount,row.legacyCount,row.matched,row.mismatches,
        row.missing,row.duplicates,row.parityPercent,row.errorRate,row.observedAt
      ]
    );
  }
}
