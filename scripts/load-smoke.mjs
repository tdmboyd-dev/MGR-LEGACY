const baseUrl=process.env.LEGACY_BASE_URL;
if(!baseUrl) throw new Error("LEGACY_BASE_URL is required");

const token=process.env.LEGACY_API_TOKEN;
const tenantId=process.env.LEGACY_TENANT_ID;
const concurrency=Math.max(1,Number(process.env.LOAD_CONCURRENCY ?? 10));
const requests=Math.max(concurrency,Number(process.env.LOAD_REQUESTS ?? 100));

const headers={};
if(token) headers.authorization=`Bearer ${token}`;
if(tenantId) headers["x-tenant-id"]=tenantId;

async function one(index){
  const started=performance.now();
  const response=await fetch(new URL("/health",baseUrl),{headers});
  const duration=performance.now()-started;
  if(!response.ok) throw new Error(`Request ${index} failed with HTTP ${response.status}`);
  await response.arrayBuffer();
  return duration;
}

const durations=[];
let cursor=0;
const workers=Array.from({length:concurrency},async()=>{
  while(true){
    const index=cursor++;
    if(index>=requests) return;
    durations.push(await one(index));
  }
});

const started=performance.now();
await Promise.all(workers);
const elapsed=performance.now()-started;
durations.sort((a,b)=>a-b);
const pick=p=>durations[Math.min(durations.length-1,Math.floor(durations.length*p))] ?? 0;

console.log(JSON.stringify({
  ok:true,
  requests,
  concurrency,
  elapsedMs:Number(elapsed.toFixed(2)),
  requestsPerSecond:Number((requests/(elapsed/1000)).toFixed(2)),
  latencyMs:{
    min:Number((durations[0] ?? 0).toFixed(2)),
    p50:Number(pick(0.50).toFixed(2)),
    p95:Number(pick(0.95).toFixed(2)),
    p99:Number(pick(0.99).toFixed(2)),
    max:Number((durations.at(-1) ?? 0).toFixed(2))
  }
},null,2));
