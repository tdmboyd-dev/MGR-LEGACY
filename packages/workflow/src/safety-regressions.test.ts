import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWorkflow} from './graph.js';
import {WorkflowRuntime} from './runtime.js';
import {WorkflowSimulator} from './simulator.js';
import {ApprovalGate} from './approvals-subflows.js';
import {SimpleSchedulePlanner} from './scheduling.js';
import type {WorkflowDefinition} from '@mgr/legacy-contracts';
const workflow:WorkflowDefinition={workflowId:'w',version:1,name:'test',status:'active',trigger:{type:'manual',config:{}},nodes:[{nodeId:'a',type:'noop',config:{}},{nodeId:'b',type:'noop',config:{}}],edges:[{from:'a',to:'b'},{from:'b',to:'a'}]};
test('cycles cannot simulate or execute as a successful empty run',async()=>{
 assert.equal(validateWorkflow(workflow).valid,false);assert.equal(new WorkflowSimulator().simulate(workflow).possibleLoop,true);
 await assert.rejects(()=>new WorkflowRuntime([]).run(workflow,{tenantId:'t',workflowId:'w',workflowVersion:1,runId:'r',correlationId:'c',triggerPayload:{}}),/cycle/);
});
test('unimplemented conditions fail closed instead of executing unconditional effects',()=>{
 assert.equal(validateWorkflow({...workflow,edges:[{from:'a',to:'b',condition:{field:'approved',operator:'eq',value:true}}]}).valid,false);
});
test('approval gate checks trusted role and a positive approval threshold',()=>{
 const request={id:'a',runId:'r',nodeId:'n',tenantId:'t',requestedBy:'u',approverRoles:['owner'],minimumApprovals:1,status:'pending' as const,approvals:[],denials:[],createdAt:new Date().toISOString()};
 assert.throws(()=>new ApprovalGate().decide(request,'intruder','approve'),/not authorized/);assert.equal(new ApprovalGate().decide(request,'owner','approve',['owner']).status,'approved');
});
test('schedule respects named timezone rather than silently using UTC',()=>{
 assert.equal(new SimpleSchedulePlanner().next({timezone:'America/Chicago',hour:8,minute:30},new Date('2026-01-01T00:00:00Z')),'2026-01-01T14:30:00.000Z');
 assert.throws(()=>new SimpleSchedulePlanner().next({timezone:'invalid',hour:8,minute:30}),/timezone/);
});
