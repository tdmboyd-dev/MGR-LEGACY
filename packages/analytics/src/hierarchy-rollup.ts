export interface HierarchyMetricPoint {
  nodeId:string;
  parentId?:string;
  metricKey:string;
  value:number;
}

export interface HierarchyRollup {
  nodeId:string;
  metricKey:string;
  directValue:number;
  rolledUpValue:number;
  descendantCount:number;
}

export class HierarchyRollupEngine {
  rollup(points:HierarchyMetricPoint[]):HierarchyRollup[]{
    const byNode=new Map<string,HierarchyMetricPoint[]>();
    const children=new Map<string,string[]>();
    const parentByNode=new Map<string,string>();

    for(const point of points){
      byNode.set(point.nodeId,[...(byNode.get(point.nodeId) ?? []),point]);
      if(point.parentId){
        parentByNode.set(point.nodeId,point.parentId);
        children.set(point.parentId,[...(children.get(point.parentId) ?? []),point.nodeId]);
      }
    }

    const nodeIds=new Set(points.map(point=>point.nodeId));
    for(const parent of parentByNode.values()) nodeIds.add(parent);

    const metricKeys=new Set(points.map(point=>point.metricKey));
    const results:HierarchyRollup[]=[];

    const descendants=(nodeId:string):string[]=>{
      const out:string[]=[];
      const queue=[...(children.get(nodeId) ?? [])];
      const seen=new Set<string>();
      while(queue.length){
        const id=queue.shift()!;
        if(seen.has(id)) continue;
        seen.add(id);
        out.push(id);
        queue.push(...(children.get(id) ?? []));
      }
      return out;
    };

    for(const nodeId of nodeIds){
      const desc=descendants(nodeId);
      for(const metricKey of metricKeys){
        const direct=(byNode.get(nodeId) ?? [])
          .filter(point=>point.metricKey===metricKey)
          .reduce((sum,point)=>sum+point.value,0);

        const rolled=desc.reduce((sum,id)=>
          sum+(byNode.get(id) ?? [])
            .filter(point=>point.metricKey===metricKey)
            .reduce((s,point)=>s+point.value,0),direct
        );

        if(direct!==0 || rolled!==0){
          results.push({
            nodeId,
            metricKey,
            directValue:direct,
            rolledUpValue:rolled,
            descendantCount:desc.length
          });
        }
      }
    }

    return results;
  }
}
