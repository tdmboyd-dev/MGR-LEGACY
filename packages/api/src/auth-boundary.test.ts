import test from "node:test";
import assert from "node:assert/strict";
import type { IncomingMessage } from "node:http";
import { authorize } from "./auth.js";
import { bootstrapLegacyApi } from "./bootstrap.js";
import { DefaultLegacyApiServices } from "./services.js";
import { PostgresDatabase } from "@mgr/legacy-database";

const request=(header?:string)=>({headers:header===undefined?{}:{authorization:header}} as IncomingMessage);

test("service authorization denies missing, empty and whitespace configuration",()=>{
  for(const bearerToken of [undefined,"","   "]){
    assert.equal(authorize(request(),{bearerToken}),false);
    assert.equal(authorize(request("Bearer fixture-token"),{bearerToken}),false);
  }
});

test("service authorization accepts only the configured bearer",()=>{
  const config={bearerToken:"fixture-only-token"};
  for(const header of [undefined,"Bearer ","Bearer wrong","Basic fixture-only-token"]){
    assert.equal(authorize(request(header),config),false);
  }
  assert.equal(authorize(request("Bearer fixture-only-token"),config),true);
});

test("bootstrap refuses missing credential before database setup",async()=>{
  const old=process.env.LEGACY_API_TOKEN;
  try{
    delete process.env.LEGACY_API_TOKEN;
    await assert.rejects(bootstrapLegacyApi(),/LEGACY_API_TOKEN is required/);
  }finally{
    if(old===undefined) delete process.env.LEGACY_API_TOKEN;
    else process.env.LEGACY_API_TOKEN=old;
  }
});

test("body tenant override is rejected before any database query",async()=>{
  const db=new PostgresDatabase("postgresql://fixture-only.invalid/db");
  let queries=0;
  db.query=async()=>{queries++;throw new Error("Unexpected database query");};
  const services=new DefaultLegacyApiServices(db);
  const filter={tenantId:"tenant-b",clientEntityId:"client-1",taxYear:2025};
  const calls=[
    ()=>services.saveTaxRequiredDocuments({...filter,documents:[]},"tenant-a"),
    ()=>services.metricSeries({tenantId:"tenant-b",metricKey:"fixture"} as {metricKey:string},"tenant-a"),
    ()=>services.listTaxFacts(filter,"tenant-a"),
    ()=>services.reviewTaxFact({tenantId:"tenant-b",factId:"fact-1",reviewerId:"reviewer-1",decision:"accept"} as {factId:string;reviewerId:string;decision:"accept"},"tenant-a"),
    ()=>services.listActionReceipts({tenantId:"tenant-b"} as {},"tenant-a")
  ];
  try{
    for(const call of calls)await assert.rejects(call,/Tenant mismatch/);
    assert.equal(queries,0);
  }finally{await db.close();}
});

test("matching or absent body tenant preserves trusted tenant and valid writes",async()=>{
  const db=new PostgresDatabase("postgresql://fixture-only.invalid/db");
  const seen:unknown[][]=[];
  db.query=async(_sql,params)=>{seen.push([...(params ?? [])]);return {rows:[],rowCount:1};};
  const services=new DefaultLegacyApiServices(db);
  const base={clientEntityId:"client-1",taxYear:2025,documents:[{code:"W2",label:"W2",required:true,received:false}]};
  try{
    await services.saveTaxRequiredDocuments(base,"tenant-a");
    const matching={...base,tenantId:"tenant-a"};
    await services.saveTaxRequiredDocuments(matching,"tenant-a");
    assert.equal(seen.length,2);
    assert.ok(seen.every(params=>params[0]==="tenant-a"));
  }finally{await db.close();}
});
