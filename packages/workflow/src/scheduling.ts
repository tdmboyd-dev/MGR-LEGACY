export interface WaitInstruction {
  mode:"duration"|"until";
  durationMs?:number;
  until?:string;
}

export class WaitPlanner {
  resolve(wait:WaitInstruction,now=new Date()):string{
    if(wait.mode==="duration"){
      if(wait.durationMs===undefined || wait.durationMs<0) throw new Error("Invalid wait duration");
      return new Date(now.getTime()+wait.durationMs).toISOString();
    }
    if(!wait.until) throw new Error("Wait-until requires timestamp");
    const target=new Date(wait.until);
    if(Number.isNaN(target.getTime())) throw new Error("Invalid wait-until timestamp");
    return target.toISOString();
  }
}

export interface ScheduleDefinition {
  timezone:string;
  daysOfWeek?:number[];
  hour:number;
  minute:number;
}

export class SimpleSchedulePlanner {
  next(def:ScheduleDefinition,from=new Date()):string{
    if(def.hour<0 || def.hour>23 || def.minute<0 || def.minute>59) throw new Error("Invalid schedule time");
    for(let offset=0;offset<14;offset++){
      const candidate=new Date(from);
      candidate.setUTCDate(candidate.getUTCDate()+offset);
      candidate.setUTCHours(def.hour,def.minute,0,0);
      if(candidate<=from) continue;
      if(def.daysOfWeek?.length && !def.daysOfWeek.includes(candidate.getUTCDay())) continue;
      return candidate.toISOString();
    }
    throw new Error("Unable to resolve next schedule occurrence");
  }
}
