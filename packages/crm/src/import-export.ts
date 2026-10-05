export interface ImportIssue {
  row:number;
  field?:string;
  message:string;
}

export interface ImportResult<T> {
  accepted:T[];
  rejected:Array<{row:number;raw:Record<string,unknown>;issues:ImportIssue[]}>;
}

export class RecordImporter<T> {
  constructor(private readonly parse:(raw:Record<string,unknown>,row:number)=>{value?:T;issues:ImportIssue[]}){}

  import(rows:Record<string,unknown>[]):ImportResult<T>{
    const accepted:T[]=[];
    const rejected:ImportResult<T>["rejected"]=[];

    rows.forEach((raw,index)=>{
      const row=index+1;
      const result=this.parse(raw,row);
      if(result.value && result.issues.length===0) accepted.push(result.value);
      else rejected.push({row,raw,issues:result.issues});
    });

    return {accepted,rejected};
  }
}

function csvCell(value:unknown):string{
  const text=value===null || value===undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g,'""')}"` : text;
}

export function toCsv(rows:Record<string,unknown>[]):string{
  if(!rows.length) return "";
  const headers=[...new Set(rows.flatMap(row=>Object.keys(row)))];
  const lines=[headers.map(csvCell).join(",")];
  for(const row of rows){
    lines.push(headers.map(key=>csvCell(row[key])).join(","));
  }
  return lines.join("\n");
}
