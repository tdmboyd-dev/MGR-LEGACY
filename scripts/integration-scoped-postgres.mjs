import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {PostgresDatabase,MigrationRunner,PostgresTemplateSequenceRepository,PostgresOutbox,PostgresEventLedger} from '../packages/database/dist/index.js';
import {DefaultLegacyApiServices} from '../packages/api/dist/services.js';
import {createLegacyServer} from '../packages/api/dist/http.js';
const url=process.env.LEGACY_DATABASE_URL;
if(!url) throw Error('LEGACY_DATABASE_URL required (isolated database only)');
let db=new PostgresDatabase(url),server;
const checks=[];
const check=(name)=>checks.push(name);
const tenant=randomUUID(),other=randomUUID(),actor='tevin-test-owner',token=randomUUID();
const principal={actorId:actor,tenantIds:[tenant],actions:['crm.create_contact','crm.update_contact','crm.create_deal','crm.update_deal','crm.log_activity','crm.read_contact']};
async function start(){server=createLegacyServer(new DefaultLegacyApiServices(db),{bearerToken:token,principal});await new Promise(r=>server.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${server.address().port}`;}
async function stop(){await new Promise(r=>server.close(r));await db.close();}
try{
 await new MigrationRunner(db,resolve('packages/database/migrations')).runPending();
 for(const id of [tenant,other]) await db.query('INSERT INTO tenants(id,name,slug) VALUES($1,$2,$3)',[id,'Scoped test',id]);
 let base=await start();
 const headers={authorization:`Bearer ${token}`,'content-type':'application/json','x-tenant-id':tenant,'x-actor-id':actor};
 const request=async(body,overrides={})=>{const response=await fetch(`${base}/v1/commands`,{method:'POST',headers:{...headers,...overrides},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};};
 const body={action:'crm.create_contact',payload:{firstName:'Tevin',lastName:'Verified'},metadata:{userId:actor,idempotencyKey:randomUUID(),correlationId:randomUUID()}};
 let result=await request(body);assert.equal(result.status,200);const id=result.body.result.id;check('real PostgreSQL contact creation');
 assert.equal((await fetch(`${base}/v1/entities/${id}`,{headers})).status,200);check('tenant-scoped durable entity readback');
 const nonPerson=randomUUID();await db.query("INSERT INTO entities(id,tenant_id,entity_type,display_name) VALUES($1,$2,'company','Private company')",[nonPerson,tenant]);
 assert.equal((await fetch(`${base}/v1/entities/${nonPerson}`,{headers})).status,404);check('contact read grant cannot read another entity type');
 assert.equal((await fetch(`${base}/v1/truth/receipts?actorId=intruder&action=crm.create_contact`,{headers})).status,403);check('receipt read cannot impersonate another actor');
 assert.equal((await fetch(`${base}/v1/truth/receipts?action=tax.emit_event`,{headers})).status,403);check('receipt read cannot inspect ungranted action');
 assert.equal((await fetch(`${base}/v1/truth/receipts`,{headers})).status,403);check('receipt read requires an explicit granted action');
 const scopedReceipts=await fetch(`${base}/v1/truth/receipts?action=crm.create_contact&correlationId=${body.metadata.correlationId}`,{headers});assert.equal(scopedReceipts.status,200);assert.ok((await scopedReceipts.json()).every(r=>r.actor.actorId===actor));check('receipt read binds authenticated actor');
 assert.equal((await request(body,{'x-tenant-id':other})).status,403);check('foreign tenant header denied');
 assert.equal((await request(body,{'x-actor-id':'intruder'})).status,403);check('foreign actor header denied');
 assert.equal((await request({...body,metadata:{...body.metadata,userId:'intruder'}})).status,403);check('foreign actor body denied');
 assert.equal((await request({...body,actor:{actorType:'service'},metadata:{...body.metadata,userId:undefined,sourceSystem:'intruder'}})).status,403);check('partial canonical actor cannot bypass principal binding');
 assert.equal((await request({...body,action:'tax.emit_event'})).status,403);check('ungranted action denied');
 assert.equal((await request({...body,payload:{firstName:'Changed'}})).status,409);check('changed payload same key conflicts');
 assert.equal((await request({...body,target:{entityType:'person',entityId:randomUUID()}})).status,409);check('changed target same key conflicts');
 assert.equal((await request(body)).body.replayed,true);check('exact request replay returns saved receipt');
 const race={...body,metadata:{...body.metadata,idempotencyKey:randomUUID()},payload:{firstName:'Concurrent'}};
 const races=await Promise.all(Array.from({length:20},()=>request(race)));assert.ok(races.every(r=>r.status===200));assert.equal(new Set(races.map(r=>r.body.receiptId)).size,1);check('20 concurrent exact requests one receipt');
 const foreign=randomUUID();await db.query("INSERT INTO entities(id,tenant_id,entity_type,display_name) VALUES($1,$2,'person','Foreign')",[foreign,other]);
 assert.equal((await fetch(`${base}/v1/entities/${foreign}`,{headers})).status,404);check('foreign object read denied');
 assert.equal((await request({action:'crm.update_contact',payload:{id:foreign,firstName:'Stolen'},metadata:{idempotencyKey:randomUUID()}})).status,404);check('foreign object update denied');
 assert.equal((await request({action:'crm.log_activity',payload:{contactId:foreign},metadata:{idempotencyKey:randomUUID()}})).status,404);check('foreign activity subject denied');
 const templates=new PostgresTemplateSequenceRepository(db),template={id:randomUUID(),tenantId:other,name:'Private',channel:'email',body:'Private',variables:[],active:true};
 await templates.saveTemplate(template);await assert.rejects(()=>templates.saveTemplate({...template,tenantId:tenant,body:'Overwrite'}),/Tenant mismatch/);check('global ID upsert cannot overwrite foreign template');
 const evidence=await db.query('SELECT (SELECT count(*)::int FROM entities WHERE tenant_id=$1 AND attributes->>\'firstName\'=\'Concurrent\') AS entities,(SELECT count(*)::int FROM event_ledger WHERE tenant_id=$1 AND idempotency_key=$2) AS events,(SELECT count(*)::int FROM outbox o JOIN event_ledger e ON e.event_id=o.event_id WHERE e.tenant_id=$1 AND e.idempotency_key=$2) AS outbox',[tenant,race.metadata.idempotencyKey]);
 assert.deepEqual(evidence.rows[0],{entities:1,events:1,outbox:1});check('atomic entity event and outbox exactly once');
 // Drop an actual HTTP response after the server committed, then repeat the identical request.
 const lost={...body,metadata:{...body.metadata,idempotencyKey:randomUUID()},payload:{firstName:'LostResponse'}};
 const lostResponse=await fetch(`${base}/v1/commands`,{method:'POST',headers,body:JSON.stringify(lost)});assert.equal(lostResponse.status,200);await lostResponse.body.cancel();
 const recovered=await request(lost);assert.equal(recovered.body.replayed,true);check('discarded response recovered by durable replay');
 const ledger=new PostgresEventLedger(db);await ledger.append(result.body.event);await assert.rejects(()=>ledger.append({...result.body.event,data:{changed:true}}),/Event idempotency conflict/);check('event ledger exact duplicate accepted changed payload rejected');
 const outbox=new PostgresOutbox(db);await outbox.enqueue(result.body.event);await outbox.enqueue(result.body.event);await assert.rejects(()=>outbox.enqueue({...result.body.event,data:{changed:true}}),/Outbox idempotency conflict/);check('outbox exact duplicate accepted changed payload rejected');
 const outboxCount=await db.query('SELECT count(*)::int AS count FROM outbox WHERE event_id=$1',[result.body.event.eventId]);assert.equal(outboxCount.rows[0].count,1);check('outbox duplicate never creates second publication');
 const receiptId=result.body.receiptId;
 await stop();db=new PostgresDatabase(url);base=await start();
 const reopened=await fetch(`${base}/v1/entities/${id}`,{headers});assert.equal(reopened.status,200);assert.equal((await reopened.json()).attributes.firstName,'Tevin');
 result=await request(body);assert.equal(result.body.receiptId,receiptId);assert.equal(result.body.replayed,true);check('new server and database pool preserve contact and receipt');
 console.log(JSON.stringify({ok:true,database:'real PostgreSQL',checks,passed:checks.length,total:checks.length,tenantId:tenant,entityId:id,receiptId,evidence:evidence.rows[0]},null,2));
}finally{if(server?.listening) await stop();else await db.close();}

