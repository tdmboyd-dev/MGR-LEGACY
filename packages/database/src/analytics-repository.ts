import type { Goal, ReportDefinition } from "@mgr/legacy-analytics";
import type { SqlExecutor } from "./sql.js";

export class PostgresAnalyticsRepository {
  constructor(private readonly db:SqlExecutor){}

  async saveReport(definition:ReportDefinition):Promise<void>{
    await this.db.query(
      `INSERT INTO saved_reports (id,tenant_id,name,definition)
       VALUES ($1,$2,$3,$4::jsonb)
       ON CONFLICT (id)
       DO UPDATE SET name=EXCLUDED.name,definition=EXCLUDED.definition,updated_at=now()`,
      [definition.id,definition.tenantId,definition.name,JSON.stringify(definition)]
    );
  }

  async listReports(tenantId:string):Promise<ReportDefinition[]>{
    const result=await this.db.query<any>(
      "SELECT definition FROM saved_reports WHERE tenant_id=$1 ORDER BY updated_at DESC",
      [tenantId]
    );
    return result.rows.map(row=>row.definition as ReportDefinition);
  }

  async saveGoal(goal:Goal):Promise<void>{
    await this.db.query(
      `INSERT INTO goals
       (id,tenant_id,scope_type,scope_id,metric_key,target,period_start,period_end)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id)
       DO UPDATE SET scope_type=EXCLUDED.scope_type,scope_id=EXCLUDED.scope_id,
       metric_key=EXCLUDED.metric_key,target=EXCLUDED.target,
       period_start=EXCLUDED.period_start,period_end=EXCLUDED.period_end,updated_at=now()`,
      [
        goal.id,goal.tenantId,goal.scopeType,goal.scopeId,goal.metricKey,
        goal.target,goal.periodStart,goal.periodEnd
      ]
    );
  }

  async listGoals(tenantId:string,scopeType?:string,scopeId?:string):Promise<Goal[]>{
    const params:any[]=[tenantId];
    const clauses=["tenant_id=$1"];
    if(scopeType){params.push(scopeType);clauses.push(`scope_type=$${params.length}`);}
    if(scopeId){params.push(scopeId);clauses.push(`scope_id=$${params.length}`);}
    const result=await this.db.query<any>(
      `SELECT * FROM goals WHERE ${clauses.join(" AND ")} ORDER BY period_start DESC`,
      params
    );
    return result.rows.map(row=>({
      id:row.id,tenantId:row.tenant_id,scopeType:row.scope_type,scopeId:row.scope_id,
      metricKey:row.metric_key,target:Number(row.target),
      periodStart:new Date(row.period_start).toISOString(),
      periodEnd:new Date(row.period_end).toISOString()
    }));
  }

  async metricSeries(input:{
    tenantId:string;
    metricKey:string;
    from?:string;
    to?:string;
    scopeType?:string;
    scopeId?:string;
  }):Promise<Array<{value:number;observedAt:string;dimensions:Record<string,string>}>>{
    const params:any[]=[input.tenantId,input.metricKey];
    const clauses=["tenant_id=$1","metric_key=$2"];
    const add=(sql:string,value:any)=>{params.push(value);clauses.push(sql.replace("?",`$${params.length}`));};
    if(input.from) add("observed_at>=?",input.from);
    if(input.to) add("observed_at<=?",input.to);
    if(input.scopeType) add("scope_type=?",input.scopeType);
    if(input.scopeId) add("scope_id=?",input.scopeId);
    const result=await this.db.query<any>(
      `SELECT value,observed_at,dimensions FROM metric_points
       WHERE ${clauses.join(" AND ")}
       ORDER BY observed_at`,
      params
    );
    return result.rows.map(row=>({
      value:Number(row.value),
      observedAt:new Date(row.observed_at).toISOString(),
      dimensions:row.dimensions ?? {}
    }));
  }
}
