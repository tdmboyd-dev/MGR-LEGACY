export interface MigrationCheckpoint {
  source:"mgr-agents"|"elite-hub";
  entityType:string;
  lastCursor?:string;
  migrated:number;
  failed:number;
  startedAt:string;
  updatedAt:string;
}

export interface ReconciliationResult {
  sourceCount:number;
  destinationCount:number;
  matched:number;
  missingInDestination:string[];
  mismatched:string[];
  duplicateDestinationIds:string[];
}

export function reconcileIds(sourceIds:string[],destinationIds:string[]):ReconciliationResult {
  const sourceSet=new Set(sourceIds);
  const destinationSet=new Set(destinationIds);
  const duplicateDestinationIds=destinationIds.filter((id,index)=>destinationIds.indexOf(id)!==index);
  const missingInDestination=[...sourceSet].filter(id=>!destinationSet.has(id));
  const matched=[...sourceSet].filter(id=>destinationSet.has(id)).length;
  return {
    sourceCount:sourceIds.length,
    destinationCount:destinationIds.length,
    matched,
    missingInDestination,
    mismatched:[],
    duplicateDestinationIds:[...new Set(duplicateDestinationIds)]
  };
}
