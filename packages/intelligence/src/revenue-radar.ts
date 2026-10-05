export interface RevenueRadarItem {
  id:string;
  amount:number;
  probability:number;
  urgency:number;
  leakRisk:number;
}

export class RevenueRadar {
  rank(items:RevenueRadarItem[]):Array<RevenueRadarItem & {score:number}>{
    return items
      .map(item=>({...item,score:item.amount*Math.max(0,item.probability)*Math.max(0.1,item.urgency)*(1+item.leakRisk)}))
      .sort((a,b)=>b.score-a.score);
  }
}
