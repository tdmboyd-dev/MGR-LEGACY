/** Isolated real PostgreSQL regression. Creates/drops only its random test schema. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {PostgresDatabase,MigrationRunner,PostgresTaxPackRepository,PostgresObjectSchemaRepository,PostgresWorkflowRepository} from '../packages/database/dist/index.js';
const url=process.env.LEGACY_DATABASE_URL;if(!url)throw Error('LEGACY_DATABASE_URL required: isolated database only');
const schema='atomic_'+randomUUID().replaceAll('-',''),admin=new PostgresDatabase(url);
const scoped=new URL(url);scoped.searchParams.set('options','-csearch_path='+schema);
const db=new PostgresDatabase(scoped.toString()),checks=[];
async function test(name,fn){try{await fn();checks.push({name,passed:true});}catch(e){checks.push({name,passed:false,error:e.message});}}
try{
 await admin.query('CREATE SCHEMA '+schema);await new MigrationRunner(db,resolve('packages/database/migrations')).runPending();
 const tenant=randomUUID(),fact='fact-atomic',workflowId=randomUUID();
 await db.query('INSERT INTO tenants(id,name,slug) VALUES($1,$2,$3)',[tenant,'Atomic test',tenant]);
 await db.query(`INSERT INTO tax_facts(id,tenant_id,client_entity_id,tax_year,form_type,canonical_field,value,confidence,source,extraction) VALUES($1,$2,'client',2026,'fixture','income','10',1,'{}','{}')`,[fact,tenant]);
 const tax=new PostgresTaxPackRepository(db);
 await test('failed history insert rolls back tax fact change',async()=>{
  await db.query(`CREATE FUNCTION reject_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected history failure'; END $$; CREATE TRIGGER reject_history BEFORE INSERT ON tax_fact_review_events FOR EACH ROW EXECUTE FUNCTION reject_history()`);
  try{await assert.rejects(tax.reviewTaxFact({tenantId:tenant,factId:fact,reviewerId:'reviewer',decision:'correct',correctedValue:20}));assert.equal((await tax.listTaxFacts({tenantId:tenant,clientEntityId:'client',taxYear:2026}))[0].value,10);}finally{await db.query('DROP TRIGGER reject_history ON tax_fact_review_events; DROP FUNCTION reject_history()');}
 });
 // Restore only this synthetic fixture baseline, even on a pre-repair run.
 await db.query("UPDATE tax_facts SET value='10',original_value=NULL,review_status='unreviewed',reviewed_by=NULL,reviewed_at=NULL WHERE id=$1",[fact]);
 const objects=new PostgresObjectSchemaRepository(db),now=new Date().toISOString();
 await objects.save({tenantId:tenant,objectKey:'fixture',version:1,status:'active',schema:{},createdAt:now});
 await test('missing schema target preserves active version',async()=>{await assert.rejects(objects.activate(tenant,'fixture',999));assert.equal((await objects.latest(tenant,'fixture')).status,'active');});
 const workflows=new PostgresWorkflowRepository(db,tenant),definition={workflowId,version:1,name:'Fixture',status:'active',trigger:{type:'manual'},nodes:[],edges:[]};
 await workflows.save(definition);
 await test('missing workflow target preserves active version',async()=>{await assert.rejects(workflows.activate(workflowId,999));assert.equal((await workflows.get(workflowId,1)).status,'active');});
 await test('concurrent fact corrections preserve serial history and original value',async()=>{
  await Promise.all(Array.from({length:8},(_,i)=>tax.reviewTaxFact({tenantId:tenant,factId:fact,reviewerId:'reviewer-'+i,decision:'correct',correctedValue:i+100})));
  const history=(await db.query('SELECT before_value,after_value FROM tax_fact_review_events WHERE tenant_id=$1 AND fact_id=$2 ORDER BY id',[tenant,fact])).rows;
  assert.equal(history.length,8);assert.equal(history[0].before_value,10);
  for(let i=1;i<history.length;i++)assert.equal(history[i].before_value,history[i-1].after_value);
  const saved=(await tax.listTaxFacts({tenantId:tenant,clientEntityId:'client',taxYear:2026}))[0];assert.equal(saved.originalValue,10);assert.equal(saved.value,history.at(-1).after_value);
 });
 await test('foreign tenant cannot review a fact or add review history',async()=>{
  await assert.rejects(tax.reviewTaxFact({tenantId:'other',factId:fact,reviewerId:'intruder',decision:'accept'}),/not found/);
  assert.equal((await db.query('SELECT count(*)::int n FROM tax_fact_review_events WHERE tenant_id=$1',['other'])).rows[0].n,0);
 });
 await test('concurrent schema activations leave exactly one active version',async()=>{
  for(const version of [2,3])await objects.save({tenantId:tenant,objectKey:'fixture',version,status:'draft',schema:{},createdAt:now});
  await Promise.all([objects.activate(tenant,'fixture',2),objects.activate(tenant,'fixture',3)]);
  assert.equal((await db.query("SELECT count(*)::int n FROM object_schema_versions WHERE tenant_id=$1 AND object_key='fixture' AND status='active'",[tenant])).rows[0].n,1);
 });
 await test('concurrent workflow activations leave exactly one active version',async()=>{
  for(const version of [2,3])await workflows.save({...definition,version,status:'draft'});
  await Promise.all([workflows.activate(workflowId,2),workflows.activate(workflowId,3)]);
  assert.equal((await db.query("SELECT count(*)::int n FROM workflow_definitions WHERE tenant_id=$1 AND workflow_id=$2 AND status='active'",[tenant,workflowId])).rows[0].n,1);
 });
 for(const kind of ['schema','workflow'])await test(kind+' activation write failure rolls back retirement',async()=>{
  const table=kind==='schema'?'object_schema_versions':'workflow_definitions';
  const filter=kind==='schema'?"tenant_id=$1 AND object_key='fixture'":'tenant_id=$1 AND workflow_id=$2';
  const args=kind==='schema'?[tenant]:[tenant,workflowId];
  const before=(await db.query(`SELECT version FROM ${table} WHERE ${filter} AND status='active'`,args)).rows[0].version;
  if(kind==='schema')await objects.save({tenantId:tenant,objectKey:'fixture',version:4,status:'draft',schema:{},createdAt:now});
  else await workflows.save({...definition,version:4,status:'draft'});
  await db.query(`CREATE FUNCTION reject_activation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.status='active' AND NEW.version=4 THEN RAISE EXCEPTION 'injected activation failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_activation BEFORE UPDATE ON ${table} FOR EACH ROW EXECUTE FUNCTION reject_activation()`);
  try{await assert.rejects(kind==='schema'?objects.activate(tenant,'fixture',4):workflows.activate(workflowId,4));assert.deepEqual((await db.query(`SELECT version FROM ${table} WHERE ${filter} AND status='active'`,args)).rows,[{version:before}]);}
  finally{await db.query(`DROP TRIGGER reject_activation ON ${table}; DROP FUNCTION reject_activation()`);}
 });
 console.log(JSON.stringify({scope:'Real PostgreSQL isolated-schema atomicity/concurrency, synthetic records; no filing, provider or production acceptance',checks,passed:checks.filter(x=>x.passed).length,total:checks.length},null,2));
 if(checks.some(x=>!x.passed))process.exitCode=1;
}finally{await db.close();await admin.query('DROP SCHEMA '+schema+' CASCADE');await admin.close();}
