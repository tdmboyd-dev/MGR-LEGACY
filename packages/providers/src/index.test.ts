import test from "node:test";
import assert from "node:assert/strict";
import { HttpEmbeddingProvider, HttpImageGenerationProvider, HttpVoiceProvider } from "./index.js";

const fakeFetch:typeof fetch=async(input)=>{
  const url=String(input);
  if(url.includes("embed")){
    return new Response(JSON.stringify({model:"embed-1",vectors:[[0.1,0.2]],usage:{input_tokens:3}}),{status:200});
  }
  return new Response(JSON.stringify({model:"image-1",images:[{url:"https://example.test/a.png"}]}),{status:200});
};

test("embedding adapter normalizes provider response",async()=>{
  const provider=new HttpEmbeddingProvider({
    providerKey:"test",baseUrl:"https://provider.test/",embeddingsPath:"embed"
  },fakeFetch);
  const result=await provider.embed({texts:["hello"]});
  assert.deepEqual(result.vectors,[[0.1,0.2]]);
  assert.equal(result.model,"embed-1");
});

test("image adapter normalizes provider response",async()=>{
  const provider=new HttpImageGenerationProvider({
    providerKey:"test",baseUrl:"https://provider.test/",imagePath:"images"
  },fakeFetch);
  const result=await provider.generate({prompt:"test"});
  assert.equal(result.images[0]?.uri,"https://example.test/a.png");
});

test("empty provider responses never become artifacts or embeddings",async()=>{
 const empty:typeof fetch=async()=>Response.json({});
 await assert.rejects(()=>new HttpImageGenerationProvider({providerKey:"p",baseUrl:"https://fixture.invalid",imagePath:"image"},empty).generate({prompt:"test"}),/no image artifacts/);
 await assert.rejects(()=>new HttpEmbeddingProvider({providerKey:"p",baseUrl:"https://fixture.invalid",embeddingsPath:"embed"},empty).embed({texts:["test"]}),/invalid embeddings/);
 await assert.rejects(()=>new HttpVoiceProvider({providerKey:"p",baseUrl:"https://fixture.invalid",speechPath:"speech"},empty).synthesize({text:"test"}),/no speech artifact/);
});
