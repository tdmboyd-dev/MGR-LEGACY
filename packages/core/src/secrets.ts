export interface SecretRef {
  key:string;
  provider:string;
  version?:string;
}

export interface SecretResolver {
  resolve(ref:SecretRef):Promise<string>;
}

export class SecretUsePolicy {
  validate(ref:SecretRef):string[]{
    const errors:string[]=[];
    if(!ref.key.trim()) errors.push("Secret key is required");
    if(!ref.provider.trim()) errors.push("Secret provider is required");
    if(ref.key.toLowerCase().includes("password=")) errors.push("Secret values must not be embedded in references");
    return errors;
  }
}
