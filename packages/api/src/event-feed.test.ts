import test from 'node:test';import assert from 'node:assert/strict';
import {createLegacyServer} from './http.js';
import type {ApiAuthConfig,LegacyApiServices} from './types.js';
async function fixture(t:any,hook?:(input:any)=>Promise<any>){
 const grant={tenantId:'tenant',scopeType:'workspace',scopeId:'records',subjectType:'person',eventTypes:['crm.create_contact.completed'],expiresAt:Date.now()+60000};
 const auth:ApiAuthConfig={bearerToken:'synthetic-service-token',principal:{actorId:'actor',tenantIds:['tenant'],actions:['events.read'],eventReadScopes:[grant]}};let reads=0;
 const server=createLegacyServer({readEvents:async(input:any)=>{reads++;return hook?hook(input):{events:[],after:input.after};}} as LegacyApiServices,auth);await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise<void>(r=>{server.close(()=>r());server.closeAllConnections();}));const port=(server.address() as any).port;
 const get=(q='',headers:any={})=>fetch('http://127.0.0.1:'+port+'/v1/events?scopeType=workspace&scopeId=records&subjectType=person'+q,{headers:{authorization:'Bearer synthetic-service-token','x-tenant-id':'tenant','x-actor-id':'actor',...headers}});
 return{auth,grant,get,reads:()=>reads};
}
test('event API requires explicit current actor tenant action and row-scope grant',async t=>{
 const f=await fixture(t);assert.equal((await f.get()).status,200);assert.equal((await f.get('',{'x-tenant-id':'other'})).status,403);assert.equal((await f.get('',{'x-actor-id':'other'})).status,403);assert.equal((await f.get('&scopeId=other')).status,400);assert.equal((await f.get('&actorId=other')).status,400);f.auth.principal!.actions=[];assert.equal((await f.get()).status,403);assert.equal(f.reads(),1);
});
test('event read refuses expired or changed grant after await',async t=>{
 let release!:()=>void,entered!:()=>void;const ready=new Promise<void>(r=>entered=r),held=new Promise<void>(r=>release=r);const f=await fixture(t,async i=>{entered();await held;return{events:[],after:i.after};});
 const pending=f.get();await ready;f.grant.expiresAt=0;release();const response=await pending;assert.equal(response.status,403);assert.doesNotMatch(await response.text(),/eventId/);
});
test('event cursor binds actor tenant scope and exact signature',async t=>{
 const f=await fixture(t,async()=>({events:[],after:'1'})),first=await(await f.get()).json() as any;assert.equal(typeof first.nextCursor,'string');
 assert.equal((await f.get('&cursor='+encodeURIComponent(first.nextCursor))).status,200);assert.equal((await f.get('&cursor='+encodeURIComponent(first.nextCursor.slice(0,-1)+(first.nextCursor.endsWith('0')?'1':'0')))).status,400);f.auth.principal!.actorId='different';assert.equal((await f.get('&cursor='+encodeURIComponent(first.nextCursor),{'x-actor-id':'different'})).status,400);
});
