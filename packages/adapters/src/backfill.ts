export interface BackfillPage<T> {
  rows:T[];
  nextCursor?:string;
}

export interface BackfillSource<T> {
  page(cursor?:string,limit?:number):Promise<BackfillPage<T>>;
}

export interface BackfillDestination<T> {
  upsert(row:T):Promise<void>;
}

export interface BackfillProgress {
  processed:number;
  succeeded:number;
  failed:number;
  cursor?:string;
  failures:Array<{id?:string;error:string}>;
}

export class BackfillRunner<T extends {id?:string}> {
  constructor(
    private readonly source:BackfillSource<T>,
    private readonly destination:BackfillDestination<T>
  ) {}

  async run(input:{cursor?:string;pageSize?:number;maxPages?:number}={}):Promise<BackfillProgress>{
    let cursor=input.cursor;
    let processed=0;
    let succeeded=0;
    let failed=0;
    const failures:Array<{id?:string;error:string}>=[];
    const maxPages=input.maxPages ?? Number.POSITIVE_INFINITY;
    let pageCount=0;

    while(pageCount<maxPages){
      const page=await this.source.page(cursor,input.pageSize ?? 500);
      pageCount+=1;

      for(const row of page.rows){
        processed+=1;
        try{
          await this.destination.upsert(row);
          succeeded+=1;
        }catch(error){
          failed+=1;
          failures.push({
            id:row.id,
            error:error instanceof Error ? error.message : String(error)
          });
        }
      }

      cursor=page.nextCursor;
      if(!cursor) break;
    }

    return {processed,succeeded,failed,cursor,failures};
  }
}
