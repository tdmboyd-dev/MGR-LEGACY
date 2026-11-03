export interface WaitInstruction {
  mode:"duration"|"until";
  durationMs?:number;
  until?:string;
}

export class WaitPlanner {
  resolve(wait:WaitInstruction,now=new Date()):string{
    if(wait.mode==="duration"){
      if(wait.durationMs===undefined || !Number.isFinite(wait.durationMs) || wait.durationMs<0) throw new Error("Invalid wait duration");
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
    if(!Number.isInteger(def.hour)||def.hour<0||def.hour>23||!Number.isInteger(def.minute)||def.minute<0||def.minute>59)throw new Error("Invalid schedule time");
    if(def.daysOfWeek?.some(day=>!Number.isInteger(day)||day<0||day>6))throw new Error("Invalid schedule weekday");
    let formatter:Intl.DateTimeFormat;
    try{formatter=new Intl.DateTimeFormat("en-US",{timeZone:def.timezone,weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});}catch{throw new Error("Invalid schedule timezone");}
    const weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const first=Math.floor(from.getTime()/60000)*60000+60000;
    for(let offset=0;offset<14*24*60;offset++){
      const candidate=new Date(first+offset*60000),parts=formatter.formatToParts(candidate);
      const get=(type:string)=>parts.find(p=>p.type===type)?.value;
      if(Number(get("hour"))!==def.hour||Number(get("minute"))!==def.minute)continue;
      if(def.daysOfWeek?.length&&!def.daysOfWeek.includes(weekdays.indexOf(get("weekday") ?? "")))continue;
      return candidate.toISOString();
    }
    throw new Error("Unable to resolve next schedule occurrence");
  }
}
