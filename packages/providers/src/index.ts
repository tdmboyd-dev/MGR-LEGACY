import type {
  CreationJob,
  CreationProvider,
  MediaJobType,
  VoiceProvider
} from "@mgr/legacy-core";

export interface EmbeddingProvider {
  embed(input:{
    texts:string[];
    model?:string;
  }):Promise<{
    vectors:number[][];
    model:string;
    usage?:{inputTokens?:number;cost?:number};
  }>;
}

export interface ImageGenerationProvider {
  generate(input:{
    prompt:string;
    model?:string;
    size?:string;
    count?:number;
  }):Promise<{
    images:Array<{uri:string;sha256?:string;metadata?:Record<string,unknown>}>;
    model:string;
    cost?:number;
  }>;
}

export interface HttpAiProviderConfig {
  providerKey:string;
  baseUrl:string;
  headers?:Record<string,string>;
  transcriptionPath?:string;
  speechPath?:string;
  embeddingsPath?:string;
  imagePath?:string;
  creationPaths?:Partial<Record<MediaJobType,string>>;
}

type FetchLike=(input:string|URL|Request,init?:RequestInit)=>Promise<Response>;

async function requestJson(
  fetcher:FetchLike,
  url:string,
  headers:Record<string,string>,
  body:unknown
):Promise<any>{
  const response=await fetcher(url,{
    method:"POST",
    headers:{"content-type":"application/json",...headers},
    body:JSON.stringify(body)
  });
  if(!response.ok){
    const text=await response.text().catch(()=>"");
    throw new Error(`Provider request failed: HTTP ${response.status}${text? ` - ${text.slice(0,300)}`:""}`);
  }
  return response.json();
}

export class HttpVoiceProvider implements VoiceProvider {
  constructor(
    private readonly config:HttpAiProviderConfig,
    private readonly fetcher:FetchLike=fetch
  ){}

  async transcribe(input:{uri:string;language?:string}){
    if(!this.config.transcriptionPath) throw new Error("Transcription path is not configured");
    const body=await requestJson(
      this.fetcher,
      new URL(this.config.transcriptionPath,this.config.baseUrl).toString(),
      this.config.headers ?? {},
      input
    );
    return {
      text:String(body.text ?? body.transcript ?? ""),
      confidence:Number(body.confidence ?? 1)
    };
  }

  async synthesize(input:{text:string;voice?:string}){
    if(!this.config.speechPath) throw new Error("Speech path is not configured");
    const body=await requestJson(
      this.fetcher,
      new URL(this.config.speechPath,this.config.baseUrl).toString(),
      this.config.headers ?? {},
      input
    );
    return {uri:String(body.uri ?? body.url ?? "")};
  }
}

export class HttpEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly config:HttpAiProviderConfig,
    private readonly fetcher:FetchLike=fetch
  ){}

  async embed(input:{texts:string[];model?:string}){
    if(!this.config.embeddingsPath) throw new Error("Embeddings path is not configured");
    const body=await requestJson(
      this.fetcher,
      new URL(this.config.embeddingsPath,this.config.baseUrl).toString(),
      this.config.headers ?? {},
      input
    );
    const vectors=(body.vectors ?? body.data?.map((item:any)=>item.embedding) ?? []) as number[][];
    return {
      vectors,
      model:String(body.model ?? input.model ?? "unknown"),
      usage:body.usage ? {
        inputTokens:Number(body.usage.input_tokens ?? body.usage.prompt_tokens ?? 0),
        cost:body.usage.cost===undefined ? undefined : Number(body.usage.cost)
      } : undefined
    };
  }
}

export class HttpImageGenerationProvider implements ImageGenerationProvider {
  constructor(
    private readonly config:HttpAiProviderConfig,
    private readonly fetcher:FetchLike=fetch
  ){}

  async generate(input:{prompt:string;model?:string;size?:string;count?:number}){
    if(!this.config.imagePath) throw new Error("Image path is not configured");
    const body=await requestJson(
      this.fetcher,
      new URL(this.config.imagePath,this.config.baseUrl).toString(),
      this.config.headers ?? {},
      input
    );
    const raw=body.images ?? body.data ?? [];
    return {
      images:raw.map((item:any)=>({
        uri:String(item.uri ?? item.url ?? item.b64_json ?? ""),
        sha256:item.sha256,
        metadata:item.metadata
      })),
      model:String(body.model ?? input.model ?? "unknown"),
      cost:body.cost===undefined ? undefined : Number(body.cost)
    };
  }
}

export class HttpCreationProvider implements CreationProvider {
  readonly providerKey:string;

  constructor(
    private readonly config:HttpAiProviderConfig,
    private readonly fetcher:FetchLike=fetch
  ){
    this.providerKey=config.providerKey;
  }

  supports(type:MediaJobType):boolean{
    return Boolean(this.config.creationPaths?.[type]);
  }

  async run(job:CreationJob):Promise<CreationJob>{
    const path=this.config.creationPaths?.[job.type];
    if(!path) throw new Error(`Creation path not configured for ${job.type}`);
    const body=await requestJson(
      this.fetcher,
      new URL(path,this.config.baseUrl).toString(),
      this.config.headers ?? {},
      job
    );
    return {
      ...job,
      provider:this.providerKey,
      model:String(body.model ?? job.model ?? "unknown"),
      status:"succeeded",
      completedAt:new Date().toISOString(),
      cost:body.cost===undefined ? job.cost : Number(body.cost),
      outputs:(body.outputs ?? body.data ?? []).map((item:any)=>({
        kind:String(item.kind ?? job.type),
        uri:String(item.uri ?? item.url ?? ""),
        sha256:item.sha256,
        metadata:item.metadata
      })),
      evidence:{...job.evidence,providerResponseId:body.id}
    };
  }
}
