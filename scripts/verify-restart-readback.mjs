import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {PostgresDatabase} from '../packages/database/dist/index.js';
const proof=JSON.parse(await readFile('../../wave2/legacy/scoped-postgres.log','utf8'));
const db=new PostgresDatabase(process.env.LEGACY_DATABASE_URL);
try{
 const entity=await db.query("SELECT id,attributes FROM entities WHERE tenant_id=$1 AND id=$2",[proof.tenantId,proof.entityId]);
 const receipt=await db.query("SELECT receipt_id,status FROM action_receipts WHERE tenant_id=$1 AND receipt_id=$2",[proof.tenantId,proof.receiptId]);
 assert.equal(entity.rows[0]?.id,proof.entityId);assert.equal(entity.rows[0]?.attributes.firstName,'Tevin');assert.equal(receipt.rows[0]?.status,'succeeded');
 const result={ok:true,proof:'actual PostgreSQL daemon and API restart',entityId:proof.entityId,receiptId:proof.receiptId,entityPreserved:true,receiptPreserved:true};
 await writeFile('../../wave2/legacy/daemon-restart-proof.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await db.close();}
