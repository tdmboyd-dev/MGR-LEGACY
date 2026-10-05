export type TaxSoftwareSurface = "browser"|"windows_desktop";
export type TaxSoftwareOperation = "read_field"|"write_field"|"open_return"|"navigate_form"|"validate_return";

export interface TaxSoftwareTarget {
  software:string;
  surface:TaxSoftwareSurface;
  taxYear:number;
  formType:string;
  canonicalField?:string;
  locator:{
    strategy:"dom"|"extension_bridge"|"uia"|"msaa"|"ocr_fallback";
    value:string;
    expectedLabel?:string;
  };
}

export interface TaxFieldWrite {
  factId:string;
  canonicalField:string;
  value:unknown;
  target:TaxSoftwareTarget;
}

export interface TaxSoftwareEvidence {
  target:TaxSoftwareTarget;
  observedBefore?:unknown;
  observedAfter?:unknown;
  screenshotRef?:string;
  receiptRef?:string;
  executedAt:string;
}

export interface TaxSoftwareAdapter {
  id:string;
  software:string;
  surface:TaxSoftwareSurface;
  supportedOperations:TaxSoftwareOperation[];
  verifyTarget(target:TaxSoftwareTarget):Promise<{ok:boolean;observedLabel?:string}>;
  readField?(target:TaxSoftwareTarget):Promise<unknown>;
  writeField?(input:TaxFieldWrite):Promise<TaxSoftwareEvidence>;
}

export interface TaxAutomationPolicy {
  allowWrites:boolean;
  allowOcrFallback:boolean;
  requireVerifiedTarget:boolean;
  requireReviewedFacts:boolean;
}

export class TaxSoftwareExecutionGuard {
  constructor(private readonly policy:TaxAutomationPolicy){}

  async executeWrite(input:{
    adapter:TaxSoftwareAdapter;
    write:TaxFieldWrite;
    factReviewStatus:"unreviewed"|"accepted"|"corrected"|"rejected";
  }):Promise<TaxSoftwareEvidence>{
    if(!this.policy.allowWrites) throw new Error("Tax software writes are disabled by policy");
    if(this.policy.requireReviewedFacts && !["accepted","corrected"].includes(input.factReviewStatus)){
      throw new Error("Tax fact must be reviewed before software entry");
    }
    if(input.write.target.locator.strategy==="ocr_fallback" && !this.policy.allowOcrFallback){
      throw new Error("OCR fallback is disabled by policy");
    }
    if(!input.adapter.supportedOperations.includes("write_field") || !input.adapter.writeField){
      throw new Error("Adapter does not support field writes");
    }
    if(input.adapter.surface!==input.write.target.surface || input.adapter.software!==input.write.target.software){
      throw new Error("Adapter does not match requested tax software target");
    }
    if(this.policy.requireVerifiedTarget){
      const verified=await input.adapter.verifyTarget(input.write.target);
      if(!verified.ok) throw new Error("Tax software target verification failed");
      if(input.write.target.locator.expectedLabel && verified.observedLabel!==input.write.target.locator.expectedLabel){
        throw new Error("Tax software target label drift detected");
      }
    }
    return input.adapter.writeField(input.write);
  }
}

export const DEFAULT_TAX_AUTOMATION_POLICY:TaxAutomationPolicy={
  allowWrites:true,
  allowOcrFallback:false,
  requireVerifiedTarget:true,
  requireReviewedFacts:true
};
