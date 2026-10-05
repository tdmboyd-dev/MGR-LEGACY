import type {
  ActionReceipt,
  PaletteCommand,
  RealtimeControlEvent,
  TruthConsoleRow
} from "@mgr/legacy-core";

export interface OperatorKpi {
  key:string;
  label:string;
  value:number|string;
  unit?:"count"|"currency"|"percent"|"ms";
  trend?:number;
}

export interface OperatorDashboardModel {
  tenantId:string;
  generatedAt:string;
  kpis:OperatorKpi[];
  truthRows:TruthConsoleRow[];
  recentReceipts:ActionReceipt[];
  alerts:Array<{
    id:string;
    severity:"info"|"warning"|"critical";
    title:string;
    description:string;
    correlationId?:string;
  }>;
}

export interface CommandPaletteModel {
  query:string;
  commands:PaletteCommand[];
  recentCommandIds:string[];
  pinnedCommandIds:string[];
}

export interface MobileOperatorCard {
  id:string;
  type:"approval"|"incident"|"workflow"|"receipt"|"message";
  title:string;
  summary:string;
  severity:"info"|"warning"|"critical";
  actions:Array<{
    id:string;
    label:string;
    command:"approve"|"deny"|"pause"|"resume"|"cancel"|"inspect";
  }>;
}

export class OperatorUiProjector {
  dashboard(input:{
    tenantId:string;
    truthRows:TruthConsoleRow[];
    receipts:ActionReceipt[];
    events:RealtimeControlEvent[];
  },now=new Date()):OperatorDashboardModel{
    const failed=input.receipts.filter(r=>r.status==="failed").length;
    const blocked=input.receipts.filter(r=>r.status==="blocked").length;
    const succeeded=input.receipts.filter(r=>r.status==="succeeded").length;
    const total=input.receipts.length;
    const cost=input.receipts.reduce((sum,r)=>sum+(r.provider?.cost ?? 0),0);

    return {
      tenantId:input.tenantId,
      generatedAt:now.toISOString(),
      kpis:[
        {key:"actions.total",label:"Actions",value:total,unit:"count"},
        {key:"actions.success",label:"Succeeded",value:succeeded,unit:"count"},
        {key:"actions.failed",label:"Failed",value:failed,unit:"count"},
        {key:"actions.blocked",label:"Blocked",value:blocked,unit:"count"},
        {key:"provider.cost",label:"Provider Cost",value:cost,unit:"currency"}
      ],
      truthRows:input.truthRows.slice(0,100),
      recentReceipts:input.receipts.slice(0,50),
      alerts:input.events
        .filter(event=>["workflow.failed","provider.incident","approval.requested"].includes(event.type))
        .slice(0,50)
        .map(event=>({
          id:event.eventId,
          severity:event.type==="workflow.failed"||event.type==="provider.incident"?"critical":"warning",
          title:event.type,
          description:String(event.payload.message ?? event.payload.reason ?? event.type),
          correlationId:event.correlationId
        }))
    };
  }

  mobile(events:RealtimeControlEvent[]):MobileOperatorCard[]{
    return events.slice(0,100).map(event=>({
      id:event.eventId,
      type:event.type==="approval.requested"?"approval":
        event.type==="provider.incident"?"incident":
        event.type.startsWith("workflow.")?"workflow":
        event.type==="action.receipt"?"receipt":"message",
      title:event.type,
      summary:String(event.payload.message ?? event.payload.reason ?? ""),
      severity:event.type==="provider.incident"||event.type==="workflow.failed"?"critical":
        event.type==="approval.requested"?"warning":"info",
      actions:event.type==="approval.requested"
        ? [
            {id:`${event.eventId}:approve`,label:"Approve",command:"approve"},
            {id:`${event.eventId}:deny`,label:"Deny",command:"deny"},
            {id:`${event.eventId}:inspect`,label:"Inspect",command:"inspect"}
          ]
        : [{id:`${event.eventId}:inspect`,label:"Inspect",command:"inspect"}]
    }));
  }
}
