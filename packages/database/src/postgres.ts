import { Pool, type PoolClient, type QueryResult } from "pg";
import type { SqlDatabase, SqlResult, SqlTransaction } from "./sql.js";

function normalizeResult<T>(result:QueryResult|QueryResult[]):SqlResult<T>{
  const final=Array.isArray(result) ? result.at(-1) : result;
  if(!final) return {rows:[],rowCount:0};
  const rows=(final.rows ?? []) as T[];
  return {rows,rowCount:final.rowCount ?? rows.length};
}

class PgTransaction implements SqlTransaction {
  constructor(private readonly client:PoolClient){}

  async query<T = Record<string,unknown>>(
    sql:string,
    params:unknown[]=[]
  ):Promise<SqlResult<T>>{
    const result=await this.client.query(sql,params as any[]);
    return normalizeResult<T>(result);
  }

  async commit():Promise<void>{
    await this.client.query("COMMIT");
    this.client.release();
  }

  async rollback():Promise<void>{
    try{await this.client.query("ROLLBACK");}
    finally{this.client.release();}
  }
}

export class PostgresDatabase implements SqlDatabase {
  readonly pool:Pool;

  constructor(connectionString:string,options:{max?:number;ssl?:boolean}={}){
    this.pool=new Pool({
      connectionString,
      max:options.max ?? 20,
      ssl:options.ssl ? {rejectUnauthorized:false} : undefined
    });
  }

  async query<T = Record<string,unknown>>(
    sql:string,
    params:unknown[]=[]
  ):Promise<SqlResult<T>>{
    const result=await this.pool.query(sql,params as any[]);
    return normalizeResult<T>(result);
  }

  async begin():Promise<SqlTransaction>{
    const client=await this.pool.connect();
    await client.query("BEGIN");
    return new PgTransaction(client);
  }

  async close():Promise<void>{
    await this.pool.end();
  }
}
