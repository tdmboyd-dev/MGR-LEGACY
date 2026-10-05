import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type { SqlDatabase, SqlResult, SqlTransaction } from "./sql.js";

class PgTransaction implements SqlTransaction {
  constructor(private readonly client:PoolClient){}

  async query<T extends QueryResultRow = QueryResultRow>(
    sql:string,
    params:unknown[]=[]
  ):Promise<SqlResult<T>>{
    const result=await this.client.query<T>(sql,params as any[]);
    return {rows:result.rows,rowCount:result.rowCount ?? result.rows.length};
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

  async query<T extends QueryResultRow = QueryResultRow>(
    sql:string,
    params:unknown[]=[]
  ):Promise<SqlResult<T>>{
    const result=await this.pool.query<T>(sql,params as any[]);
    return {rows:result.rows,rowCount:result.rowCount ?? result.rows.length};
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
