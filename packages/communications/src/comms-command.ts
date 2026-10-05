import type { Channel } from "./index.js";

export interface ConversationSignal {
  contactId:string;
  threadId:string;
  channel:Channel;
  lastInboundAt?:string;
  lastOutboundAt?:string;
  unansweredInbound:boolean;
  negativeSentiment?:boolean;
  commitmentDueAt?:string;
  escalationRequested?:boolean;
  revenueAtRisk?:number;
}

export type CommsActionType="reply"|"follow_up"|"escalate"|"schedule"|"call"|"do_nothing";

export interface CommsCommandRecommendation {
  type:CommsActionType;
  priority:number;
  reason:string;
  channel:Channel;
  contactId:string;
  threadId:string;
}

export class CommsCommand {
  recommend(signal:ConversationSignal,now=new Date()):CommsCommandRecommendation[]{
    const recs:CommsCommandRecommendation[]=[];

    if(signal.escalationRequested || signal.negativeSentiment){
      recs.push({
        type:"escalate",
        priority:0.95,
        reason:signal.escalationRequested ? "Customer requested escalation" : "Negative sentiment detected",
        channel:signal.channel,
        contactId:signal.contactId,
        threadId:signal.threadId
      });
    }

    if(signal.unansweredInbound){
      const hours=signal.lastInboundAt
        ? (now.getTime()-new Date(signal.lastInboundAt).getTime())/3_600_000
        : 0;
      recs.push({
        type:"reply",
        priority:Math.min(1,0.7+Math.max(0,hours)*0.01),
        reason:"Inbound message is unanswered",
        channel:signal.channel,
        contactId:signal.contactId,
        threadId:signal.threadId
      });
    }

    if(signal.commitmentDueAt){
      const hours=(new Date(signal.commitmentDueAt).getTime()-now.getTime())/3_600_000;
      if(hours<=24){
        recs.push({
          type:"follow_up",
          priority:hours<=0 ? 0.95 : 0.82,
          reason:hours<=0 ? "Customer commitment is overdue" : "Customer commitment is due soon",
          channel:signal.channel,
          contactId:signal.contactId,
          threadId:signal.threadId
        });
      }
    }

    if((signal.revenueAtRisk ?? 0)>0){
      recs.push({
        type:"follow_up",
        priority:Math.min(0.95,0.55+Math.log10(Math.max(1,signal.revenueAtRisk!))/10),
        reason:`Revenue at risk: $${signal.revenueAtRisk!.toFixed(2)}`,
        channel:signal.channel,
        contactId:signal.contactId,
        threadId:signal.threadId
      });
    }

    if(!recs.length){
      recs.push({
        type:"do_nothing",
        priority:0.1,
        reason:"No communication intervention needed",
        channel:signal.channel,
        contactId:signal.contactId,
        threadId:signal.threadId
      });
    }

    return recs.sort((a,b)=>b.priority-a.priority);
  }
}
