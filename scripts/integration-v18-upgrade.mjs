import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,copyFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {PostgresDatabase,MigrationRunner} from '../packages/database/dist/index.js';
import {DefaultLegacyApiServices} from '../packages/api/dist/services.js';
const url=process.env.LEGACY_DATABASE_URL;if(!url)throw Error('Isolated empty LEGACY_DATABASE_URL required');
const db=new PostgresDatabase(url),temp=await mkdtemp(join(tmpdir(),'legacy-v18-'));
try{
 const source=resolve('packages/database/migrations');const files=(await readdir(source)).filter(n=>/^\d+.*\.sql$/.test(n)).sort();for(const name of files.filter(n=>Number(n.slice(0,4))<=18))await copyFile(join(source,name),join(temp,name));
 await new MigrationRunner(db,temp).runPending();
 const tenant=randomUUID(),entity=randomUUID(),key=randomUUID(),old={accepted:true,result:{id:entity,firstName:'Preserved v18'}};
 await db.query('INSERT INTO tenants(id,name,slug) VALUES($1,$2,$3)',[tenant,'v18 preserved',tenant]);
 await db.query("INSERT INTO entities(id,tenant_id,entity_type,display_name,attributes) VALUES($1,$2,'person','Preserved v18',$3::jsonb)",[entity,tenant,JSON.stringify({firstName:'Preserved v18'})]);
 await db.query('INSERT INTO idempotency_keys(tenant_id,idempotency_key,command_id,response) VALUES($1,$2,$3,$4::jsonb)',[tenant,key,randomUUID(),JSON.stringify(old)]);
 await new MigrationRunner(db,source).runPending();
 const record=await db.query('SELECT response,request_digest FROM idempotency_keys WHERE tenant_id=$1 AND idempotency_key=$2',[tenant,key]);assert.deepEqual(record.rows[0].response,old);assert.equal(record.rows[0].request_digest,null);
 await assert.rejects(()=>new DefaultLegacyApiServices(db).executeCommand({action:'crm.create_contact',payload:{firstName:'Changed'},metadata:{tenantId:tenant,userId:'tevin',idempotencyKey:key}}),/Idempotency conflict/);
 const contacts=await db.query('SELECT count(*)::int AS count FROM entities WHERE tenant_id=$1',[tenant]);assert.equal(contacts.rows[0].count,1);
 console.log(JSON.stringify({ok:true,upgrade:'18 to 20',oldEntityPreserved:true,oldResponsePreserved:true,unknownLegacyDigestFailsClosed:true,contactCount:1},null,2));
}finally{await db.close();await rm(temp,{recursive:true,force:true});}
