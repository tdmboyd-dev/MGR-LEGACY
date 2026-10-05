export interface ReportFilter {
  field:string;
  operator:"eq"|"neq"|"gt"|"gte"|"lt"|"lte"|"in";
  value:unknown;
}

export interface ReportDefinition {
  id:string;
  tenantId:string;
  name:string;
  metricKeys:string[];
  dimensions:string[];
  filters:ReportFilter[];
  groupBy:string[];
  sort?:Array<{field:string;direction:"asc"|"desc"}>;
  limit?:number;
}

export interface ReportRow {
  dimensions:Record<string,string>;
  metrics:Record<string,number>;
}

export class ReportEngine {
  filter(rows:ReportRow[],definition:ReportDefinition):ReportRow[]{
    const filtered=rows.filter(row=>definition.filters.every(filter=>{
      const actual=(row.metrics as any)[filter.field] ?? (row.dimensions as any)[filter.field];
      switch(filter.operator){
        case "eq": return actual===filter.value;
        case "neq": return actual!==filter.value;
        case "gt": return Number(actual)>Number(filter.value);
        case "gte": return Number(actual)>=Number(filter.value);
        case "lt": return Number(actual)<Number(filter.value);
        case "lte": return Number(actual)<=Number(filter.value);
        case "in": return Array.isArray(filter.value) && filter.value.includes(actual);
      }
    }));

    const sorted=[...filtered];
    for(const sort of [...(definition.sort ?? [])].reverse()){
      sorted.sort((a,b)=>{
        const av=(a.metrics as any)[sort.field] ?? (a.dimensions as any)[sort.field];
        const bv=(b.metrics as any)[sort.field] ?? (b.dimensions as any)[sort.field];
        return sort.direction==="asc"
          ? String(av).localeCompare(String(bv),undefined,{numeric:true})
          : String(bv).localeCompare(String(av),undefined,{numeric:true});
      });
    }
    return sorted.slice(0,definition.limit ?? sorted.length);
  }
}
