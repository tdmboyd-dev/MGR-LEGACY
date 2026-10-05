export interface ReconciliationTelemetry {
  source:string;
  entityType:string;
  sourceCount:number;
  legacyCount:number;
  matched:number;
  mismatches:number;
  missing:number;
  duplicates:number;
  parityPercent:number;
  errorRate:number;
  observedAt:string;
}

export class ReconciliationHistory {
  private readonly rows:ReconciliationTelemetry[]=[];

  add(row:ReconciliationTelemetry):void{
    this.rows.push(structuredClone(row));
  }

  latest(source:string,entityType:string):ReconciliationTelemetry|null{
    return structuredClone(
      [...this.rows]
        .filter(row=>row.source===source && row.entityType===entityType)
        .sort((a,b)=>b.observedAt.localeCompare(a.observedAt))[0] ?? null
    );
  }

  trend(source:string,entityType:string):ReconciliationTelemetry[]{
    return structuredClone(
      this.rows
        .filter(row=>row.source===source && row.entityType===entityType)
        .sort((a,b)=>a.observedAt.localeCompare(b.observedAt))
    );
  }
}
