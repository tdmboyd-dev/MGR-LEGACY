import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { SqlDatabase } from "./sql.js";

function sqlLiteral(value:string):string{
  return "'" + value.replace(/'/g,"''") + "'";
}

export class MigrationRunner {
  constructor(
    private readonly db:SqlDatabase,
    private readonly directory:string
  ) {}

  async ensureTable():Promise<void>{
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS legacy_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  async applied():Promise<Set<string>>{
    await this.ensureTable();
    const result=await this.db.query<{name:string}>(
      "SELECT name FROM legacy_migrations ORDER BY name"
    );
    return new Set(result.rows.map(row=>row.name));
  }

  async runPending():Promise<string[]>{
    await this.ensureTable();
    const applied=await this.applied();
    const files=(await readdir(this.directory))
      .filter(name=>/^\d+.*\.sql$/.test(name))
      .sort();

    const completed:string[]=[];

    for(const name of files){
      if(applied.has(name)) continue;

      const raw=await readFile(join(this.directory,name),"utf8");
      const marker=`INSERT INTO legacy_migrations (name) VALUES (${sqlLiteral(name)});`;

      if(/^\s*BEGIN\s*;/i.test(raw) && /COMMIT\s*;\s*$/i.test(raw)){
        const sql=raw.replace(/COMMIT\s*;\s*$/i,`${marker}\nCOMMIT;`);
        await this.db.query(sql);
      }else{
        const tx=await this.db.begin();
        try{
          await tx.query(raw);
          await tx.query("INSERT INTO legacy_migrations (name) VALUES ($1)",[name]);
          await tx.commit();
        }catch(error){
          await tx.rollback();
          throw error;
        }
      }

      completed.push(name);
    }

    return completed;
  }
}
