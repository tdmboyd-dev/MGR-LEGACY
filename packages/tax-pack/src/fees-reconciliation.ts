export interface FeeSplit {
  participantId:string;
  type:"flat"|"percent";
  value:number;
}

export interface FeeCalculationInput {
  prepFee:number;
  platformFees:number[];
  bankRevenueShare?:number;
  splits:FeeSplit[];
}

export class FeeSplitEngine {
  calculate(input:FeeCalculationInput):{
    gross:number;
    platformDeduction:number;
    distributable:number;
    allocations:Record<string,number>;
    remainder:number;
  }{
    const gross=input.prepFee+(input.bankRevenueShare ?? 0);
    const platformDeduction=input.platformFees.reduce((a,b)=>a+b,0);
    const distributable=Math.max(0,gross-platformDeduction);
    const allocations:Record<string,number>={};
    let allocated=0;

    for(const split of input.splits){
      const amount=split.type==="flat"
        ? split.value
        : distributable*(split.value/100);
      allocations[split.participantId]=(allocations[split.participantId] ?? 0)+amount;
      allocated+=amount;
    }

    return {
      gross,
      platformDeduction,
      distributable,
      allocations,
      remainder:Number((distributable-allocated).toFixed(2))
    };
  }
}

export interface ReconciliationEntry {
  expectedId:string;
  actualId?:string;
  expectedAmount:number;
  actualAmount?:number;
}

export class FundingReconciliationEngine {
  reconcile(rows:ReconciliationEntry[]):Array<ReconciliationEntry & {variance:number;status:"matched"|"variance"|"missing"}>{
    return rows.map(row=>{
      if(row.actualAmount===undefined) return {...row,variance:row.expectedAmount,status:"missing" as const};
      const variance=Number((row.actualAmount-row.expectedAmount).toFixed(2));
      return {...row,variance,status:Math.abs(variance)<0.01?"matched":"variance"};
    });
  }
}
