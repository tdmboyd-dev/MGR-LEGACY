export interface VoiceTurn {
  turnId:string;
  tenantId:string;
  actorId:string;
  text:string;
  startedAt:string;
  endedAt?:string;
}

export interface PerceptionFrame {
  frameId:string;
  tenantId:string;
  source:"screen"|"camera"|"audio";
  capturedAt:string;
  description?:string;
  artifactUri?:string;
  sensitivity:"public"|"internal"|"private"|"restricted";
}

export interface PerceptionProvider {
  inspect(frame:PerceptionFrame):Promise<Record<string,unknown>>;
}

export interface VoiceProvider {
  transcribe(input:{uri:string;language?:string}):Promise<{text:string;confidence:number}>;
  synthesize(input:{text:string;voice?:string}):Promise<{uri:string}>;
}
