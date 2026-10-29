import {createHmac,timingSafeEqual} from 'node:crypto';
import type {IncomingMessage} from 'node:http';
import type {ApiAuthConfig,LegacyApiServices} from './types.js';
const tag='mgr-legacy-events-v1';
const text=(x:unknown):x is string=>typeof x==='string'&&x.length>0&&x.length<=512&&!/[\u0000-\u001f]/.test(x);
export async function eventFeed(req:IncomingMessage,url:URL,auth:ApiAuthConfig,services:LegacyApiServices){
 const principal=auth.principal,tenant=req.headers['x-tenant-id'],actor=req.headers['x-actor-id'];
 const scopeType=url.searchParams.get('scopeType'),scopeId=url.searchParams.get('scopeId'),subjectType=url.searchParams.get('subjectType'),subjectId=url.searchParams.get('subjectId')??undefined;
 const allowed=['scopeType','scopeId','subjectType','subjectId','cursor','limit'];
 if([...url.searchParams.keys()].some(k=>!allowed.includes(k)||url.searchParams.getAll(k).length!==1)||![scopeType,scopeId,subjectType].every(text))throw Error('Invalid event feed query');
 const limit=Number(url.searchParams.get('limit')??'100');if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('Invalid event feed limit');
 const grants=principal?.eventReadScopes?.filter(g=>g.tenantId===tenant&&g.scopeType===scopeType&&g.scopeId===scopeId&&g.subjectType===subjectType&&g.subjectId===subjectId)??[];
 const grant=grants.length===1?grants[0]:null,grantSnapshot=grant?JSON.stringify(grant):null;
 const current=()=>{
  if(req.headers.authorization!=='Bearer '+auth.bearerToken||!principal||auth.principal!==principal||typeof tenant!=='string'||!principal.tenantIds.includes(tenant)||actor!==principal.actorId||!principal.actions.includes('events.read')||!grant||JSON.stringify(grant)!==grantSnapshot||!principal.eventReadScopes?.includes(grant)||!Number.isSafeInteger(grant.expiresAt)||grant.expiresAt<=Date.now()||!Array.isArray(grant.eventTypes)||!grant.eventTypes.length||grant.eventTypes.length>10||grant.eventTypes.some(t=>!text(t)))throw Error('Event feed forbidden');
 };
 current();const binding={tenantId:tenant as string,actorId:principal!.actorId,scopeType:scopeType!,scopeId:scopeId!,subjectType:subjectType!,subjectId:subjectId??null,eventTypes:[...grant!.eventTypes].sort()},bindingHash=createHmac('sha256',auth.bearerToken!).update(JSON.stringify(binding)).digest('hex');
 const signed=(after:string)=>{const body=Buffer.from(JSON.stringify({version:1,binding:bindingHash,after})).toString('base64url');return body+'.'+createHmac('sha256',auth.bearerToken!).update(tag+':'+body).digest('hex');};
 const cursor=url.searchParams.get('cursor')??null;let after='0';
 if(cursor!==null){
  if(cursor.length>512)throw Error('Invalid event feed cursor');const [body,mac,...extra]=cursor.split('.');if(!body||!mac||extra.length||!/^[a-f0-9]{64}$/.test(mac))throw Error('Invalid event feed cursor');
  const expected=createHmac('sha256',auth.bearerToken!).update(tag+':'+body).digest();if(!timingSafeEqual(expected,Buffer.from(mac,'hex')))throw Error('Invalid event feed cursor');
  let value;try{value=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));}catch{throw Error('Invalid event feed cursor');}
  if(value.version!==1||value.binding!==bindingHash||typeof value.after!=='string'||!/^(0|[1-9][0-9]{0,18})$/.test(value.after))throw Error('Invalid event feed cursor');after=value.after;
 }
 if(!services.readEvents)throw Error('Unsupported event feed service');
 const output=await services.readEvents({...binding,subjectId:subjectId??undefined,after,limit});current();
 // Recheck the exact grant, not just continued membership after an await.
 if(createHmac('sha256',auth.bearerToken!).update(JSON.stringify({...binding,eventTypes:[...grant!.eventTypes].sort()})).digest('hex')!==bindingHash)throw Error('Event feed forbidden');
 return{protocol:tag,...binding,cursor,nextCursor:output.after===after?cursor:signed(output.after),events:output.events};
}
