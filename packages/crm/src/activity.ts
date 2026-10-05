export type ActivityType="call"|"email"|"meeting"|"task"|"note"|"agent_run"|"status_change"|"system";

export interface ActivityRecord {
  id:string;
  tenantId:string;
  ownerId:string;
  subjectType:string;
  subjectId:string;
  type:ActivityType;
  title:string;
  notes?:string;
  occurredAt:string;
  dueAt?:string;
  completedAt?:string;
  metadata:Record<string,unknown>;
}

export interface ActivityRepository {
  create(activity:ActivityRecord):Promise<ActivityRecord>;
  listForSubject(tenantId:string,subjectType:string,subjectId:string,limit?:number):Promise<ActivityRecord[]>;
}

export class ActivityService {
  constructor(private readonly repo:ActivityRepository){}

  log(activity:ActivityRecord):Promise<ActivityRecord>{
    return this.repo.create(activity);
  }

  timeline(tenantId:string,subjectType:string,subjectId:string,limit=200):Promise<ActivityRecord[]>{
    return this.repo.listForSubject(tenantId,subjectType,subjectId,limit);
  }
}
