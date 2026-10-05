import type { WorkflowDefinition } from "@mgr/legacy-contracts";

export type ConflictSeverity = "info" | "warning" | "critical";

export interface WorkflowConflict {
  type: "duplicate_action" | "competing_update" | "recursive_trigger" | "audience_overlap";
  severity: ConflictSeverity;
  workflowIds: string[];
  details: string;
}

function normalized(value:unknown):string {
  return JSON.stringify(value,Object.keys((value as Record<string,unknown>) ?? {}).sort());
}

function updateSignature(node:{type:string;config:Record<string,unknown>}):string|null {
  if(node.type!=="update_entity") return null;
  const entity=String(node.config.entityType ?? node.config.object ?? "*");
  const field=String(node.config.field ?? node.config.path ?? "*");
  return `${entity}:${field}`;
}

function emittedEvent(node:{type:string;config:Record<string,unknown>}):string|null {
  if(node.type==="emit_event") return typeof node.config.eventType==="string" ? node.config.eventType : null;
  if(node.type==="update_entity") return typeof node.config.emits==="string" ? node.config.emits : null;
  return null;
}

export class AutomationConflictDetector {
  detect(workflows:WorkflowDefinition[]):WorkflowConflict[] {
    const conflicts:WorkflowConflict[]=[];
    const active=workflows.filter(workflow=>workflow.status==="active" || workflow.status==="staged");

    for(const workflow of active){
      const triggerEvent=workflow.trigger.type==="event" ? String(workflow.trigger.config.eventType ?? "") : "";
      if(triggerEvent){
        const recursive=workflow.nodes.some(node=>emittedEvent(node)===triggerEvent);
        if(recursive){
          conflicts.push({
            type:"recursive_trigger",
            severity:"critical",
            workflowIds:[workflow.workflowId],
            details:`Workflow can emit its own trigger event (${triggerEvent})`
          });
        }
      }
    }

    for(let i=0;i<active.length;i++){
      for(let j=i+1;j<active.length;j++){
        const a=active[i]!;
        const b=active[j]!;
        const sameTrigger=a.trigger.type===b.trigger.type && normalized(a.trigger.config)===normalized(b.trigger.config);
        if(!sameTrigger) continue;

        const aActions=new Set(a.nodes.map(node=>`${node.type}:${normalized(node.config)}`));
        const duplicates=b.nodes.filter(node=>aActions.has(`${node.type}:${normalized(node.config)}`));
        if(duplicates.length){
          conflicts.push({
            type:"duplicate_action",
            severity:"warning",
            workflowIds:[a.workflowId,b.workflowId],
            details:`Same trigger can execute ${duplicates.length} identical action(s)`
          });
        }

        const aUpdates=new Set(a.nodes.map(updateSignature).filter((value):value is string=>Boolean(value)));
        const fieldCollisions=b.nodes
          .map(updateSignature)
          .filter((value):value is string=>Boolean(value) && aUpdates.has(value));

        if(fieldCollisions.length){
          conflicts.push({
            type:"competing_update",
            severity:"critical",
            workflowIds:[a.workflowId,b.workflowId],
            details:`Same trigger writes the same entity field(s): ${[...new Set(fieldCollisions)].join(", ")}`
          });
        }

        const aAudience=a.trigger.config.segmentId ?? a.trigger.config.audienceId;
        const bAudience=b.trigger.config.segmentId ?? b.trigger.config.audienceId;
        if(aAudience && bAudience && aAudience===bAudience){
          const communicationTypes=new Set(["send_message","send_email","send_sms","call"]);
          const bothCommunicate=
            a.nodes.some(node=>communicationTypes.has(node.type)) &&
            b.nodes.some(node=>communicationTypes.has(node.type));
          if(bothCommunicate){
            conflicts.push({
              type:"audience_overlap",
              severity:"warning",
              workflowIds:[a.workflowId,b.workflowId],
              details:`Same trigger and audience (${String(aAudience)}) can receive communications from both workflows`
            });
          }
        }
      }
    }

    return conflicts;
  }

  canActivate(workflow:WorkflowDefinition,others:WorkflowDefinition[]):{allowed:boolean;conflicts:WorkflowConflict[]} {
    const conflicts=this.detect([...others,workflow]).filter(item=>item.workflowIds.includes(workflow.workflowId));
    return {
      allowed:!conflicts.some(item=>item.severity==="critical"),
      conflicts
    };
  }
}
