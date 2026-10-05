import type { Channel } from "./index.js";

export interface QuietHours { startHour:number; endHour:number; }

export class SendPolicy {
  canSendAt(now:Date,quiet?:QuietHours):{allowed:boolean;reason?:string}{
    if(!quiet) return {allowed:true};
    const hour=now.getUTCHours();
    const within=quiet.startHour<quiet.endHour
      ? hour>=quiet.startHour && hour<quiet.endHour
      : hour>=quiet.startHour || hour<quiet.endHour;
    return within ? {allowed:false,reason:"Quiet hours"} : {allowed:true};
  }
}

export interface DeliveryEvent {
  tenantId:string;
  providerKey:string;
  channel:Channel;
  messageId:string;
  event:"accepted"|"delivered"|"bounced"|"failed"|"opened"|"clicked";
  at:string;
  details:Record<string,unknown>;
}

export class DeliverabilityAggregator {
  summarize(events:DeliveryEvent[]):{
    accepted:number;delivered:number;bounced:number;failed:number;deliveryRate:number;
  }{
    const accepted=events.filter(e=>e.event==="accepted").length;
    const delivered=events.filter(e=>e.event==="delivered").length;
    const bounced=events.filter(e=>e.event==="bounced").length;
    const failed=events.filter(e=>e.event==="failed").length;
    return {accepted,delivered,bounced,failed,deliveryRate:accepted===0?0:delivered/accepted};
  }
}
