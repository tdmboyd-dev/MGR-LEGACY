export interface CohortEvent {
  entityId:string;
  cohortKey:string;
  eventType:string;
  occurredAt:string;
}

export class CohortAnalyzer {
  retention(events:CohortEvent[],returnEvent:string):Array<{cohortKey:string;size:number;returned:number;retention:number}>{
    const cohorts=new Map<string,Set<string>>();
    const returned=new Map<string,Set<string>>();

    for(const event of events){
      cohorts.set(event.cohortKey,cohorts.get(event.cohortKey) ?? new Set());
      cohorts.get(event.cohortKey)!.add(event.entityId);
      if(event.eventType===returnEvent){
        returned.set(event.cohortKey,returned.get(event.cohortKey) ?? new Set());
        returned.get(event.cohortKey)!.add(event.entityId);
      }
    }

    return [...cohorts.entries()].map(([cohortKey,members])=>{
      const count=returned.get(cohortKey)?.size ?? 0;
      return {cohortKey,size:members.size,returned:count,retention:members.size===0?0:count/members.size};
    });
  }
}

export interface FunnelEvent {
  entityId:string;
  stage:string;
  occurredAt:string;
}

export class FunnelAnalyzer {
  analyze(events:FunnelEvent[],stages:string[]):Array<{stage:string;count:number;conversionFromPrevious:number}>{
    const seenByStage=new Map<string,Set<string>>();
    for(const stage of stages) seenByStage.set(stage,new Set());

    for(const event of events){
      if(seenByStage.has(event.stage)) seenByStage.get(event.stage)!.add(event.entityId);
    }

    return stages.map((stage,index)=>{
      const count=seenByStage.get(stage)!.size;
      const prior=index===0 ? count : seenByStage.get(stages[index-1]!)!.size;
      return {
        stage,
        count,
        conversionFromPrevious:index===0 ? 1 : prior===0 ? 0 : count/prior
      };
    });
  }
}
