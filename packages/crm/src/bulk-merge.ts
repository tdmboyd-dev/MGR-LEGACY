export interface MergeCandidate {
  id:string;
  email?:string;
  phone?:string;
  updatedAt:string;
  fields:Record<string,unknown>;
}

export interface MergePlan {
  survivorId:string;
  mergedIds:string[];
  mergedFields:Record<string,unknown>;
  conflicts:Array<{field:string;values:unknown[]}>;
}

export class MergePlanner {
  plan(candidates:MergeCandidate[],preferredId?:string):MergePlan{
    if(candidates.length<2) throw new Error("At least two records are required to merge");
    const survivor=preferredId
      ? candidates.find(item=>item.id===preferredId)
      : [...candidates].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];

    if(!survivor) throw new Error("Preferred survivor not found");

    const mergedFields:Record<string,unknown>={...survivor.fields};
    const conflicts:MergePlan["conflicts"]=[];
    const keys=new Set(candidates.flatMap(item=>Object.keys(item.fields)));

    for(const key of keys){
      const values=candidates.map(item=>item.fields[key]).filter(value=>value!==undefined && value!==null && value!=="");
      const unique=[...new Map(values.map(value=>[JSON.stringify(value),value])).values()];
      if(unique.length===1) mergedFields[key]=unique[0];
      else if(unique.length>1){
        conflicts.push({field:key,values:unique});
        if(mergedFields[key]===undefined) mergedFields[key]=unique[0];
      }
    }

    return {
      survivorId:survivor.id,
      mergedIds:candidates.filter(item=>item.id!==survivor.id).map(item=>item.id),
      mergedFields,
      conflicts
    };
  }
}

export async function bulkProcess<T,R>(
  rows:T[],
  worker:(row:T,index:number)=>Promise<R>,
  concurrency=10
):Promise<Array<{ok:true;value:R}|{ok:false;error:string}>>{
  const results:Array<{ok:true;value:R}|{ok:false;error:string}>=new Array(rows.length);
  let next=0;

  async function consume(){
    while(true){
      const index=next++;
      if(index>=rows.length) return;
      try{results[index]={ok:true,value:await worker(rows[index]!,index)};}
      catch(error){results[index]={ok:false,error:error instanceof Error?error.message:String(error)};}
    }
  }

  await Promise.all(Array.from({length:Math.max(1,Math.min(concurrency,rows.length))},consume));
  return results;
}
