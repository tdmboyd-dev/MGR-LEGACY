export interface PrivacyEnvelope<T=unknown> {
  value:T;
  classification:"public"|"internal"|"private"|"restricted";
  createdAt:string;
  expiresAt?:string;
  oneTick:boolean;
  trusted:boolean;
  source:string;
}

export class PrivacyIsolation {
  readable<T>(item:PrivacyEnvelope<T>,now=new Date()):boolean{
    if(item.expiresAt && new Date(item.expiresAt)<=now) return false;
    return true;
  }

  shouldPersist<T>(item:PrivacyEnvelope<T>):boolean{
    return !item.oneTick;
  }

  canInfluenceAuthorization<T>(item:PrivacyEnvelope<T>):boolean{
    return item.trusted && this.readable(item);
  }
}
