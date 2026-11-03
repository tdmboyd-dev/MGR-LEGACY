import type { SqlExecutor, SqlResult } from "./sql.js";
/** Conflict keys are global: a collision must never update another tenant's row. */
export async function tenantCheckedQuery(db:SqlExecutor,sql:string,params:unknown[]=[]):Promise<SqlResult>{
  const result=await db.query(sql,params);
  if(result.rowCount===0) throw new Error("Tenant mismatch");
  return result;
}
