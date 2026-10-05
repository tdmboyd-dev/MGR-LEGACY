export interface IntakeSignals {
  requiredFields:number;
  completedFields:number;
  missingDocuments:number;
  unansweredQuestions:number;
  daysOpen:number;
}

export class IntakeIQ {
  score(input:IntakeSignals):{score:number;blockers:string[]}{
    const completion=input.requiredFields===0?1:input.completedFields/input.requiredFields;
    const penalty=Math.min(0.8,input.missingDocuments*0.08+input.unansweredQuestions*0.04+Math.max(0,input.daysOpen-3)*0.02);
    const blockers:string[]=[];
    if(input.missingDocuments) blockers.push(`${input.missingDocuments} missing document(s)`);
    if(input.unansweredQuestions) blockers.push(`${input.unansweredQuestions} unanswered question(s)`);
    return {score:Math.max(0,Math.min(1,completion-penalty)),blockers};
  }
}
