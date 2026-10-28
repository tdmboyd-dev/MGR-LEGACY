import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryEventLedger} from './event-ledger.js';
import {HierarchyGraph} from './hierarchy.js';
import {PrivacyIsolation} from './privacy-isolation.js';
import {ShadowAutopilot} from './shadow-autopilot.js';
import {TevvSuite} from './tevv.js';
import type {LegacyEvent} from '@mgr/legacy-contracts';
test('event ledger scopes duplicate keys and all reads to tenants',async()=>{
 const ledger=new InMemoryEventLedger();const event=(tenant:string,id:string):LegacyEvent=>({eventId:id,eventType:'test',eventVersion:1,occurredAt:new Date().toISOString(),actor:{actorType:'service',actorId:'a',tenantId:tenant},scope:{tenantId:tenant,scopeType:'organization',scopeId:tenant},subject:{entityType:'person',entityId:'same'},source:'test',correlationId:'same',idempotencyKey:'same',data:{},evidence:{}});
 await ledger.append(event('a','one'));await ledger.append(event('b','two'));assert.equal((await ledger.listByCorrelation('a','same')).length,1);assert.equal(await ledger.getById('a','two'),null);assert.equal((await ledger.listBySubject('b','person','same')).length,1);
});
test('missing hierarchy targets and malformed expiry cannot authorize',()=>{
 assert.equal(new HierarchyGraph().isWithinScope('missing','missing'),false);
 assert.equal(new PrivacyIsolation().canInfluenceAuthorization({value:1,classification:'private',createdAt:new Date().toISOString(),expiresAt:'invalid',oneTick:false,trusted:true,source:'test'}),false);
});
test('invalid evidence cannot graduate autonomy and empty evaluation is not proof',async()=>{
 assert.equal(new ShadowAutopilot().evaluate('ask',{successfulRuns:NaN,failedRuns:0,blockedRuns:0,approvalOverrideRate:0,rollbackRate:0,criticalIncidents:0,evidenceCoverage:1}).eligible,false);
 assert.equal((await new TevvSuite().run([],{run:async()=>{throw Error('unused');}})).passed,false);
});
