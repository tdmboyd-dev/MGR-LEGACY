import test from "node:test";
import assert from "node:assert/strict";
import { ReliableOutboxPublisher } from "./outbox-publisher.js";

test("outbox publisher records success and failure", async()=>{
  const published:number[]=[];
  const failed:number[]=[];

  const worker=new ReliableOutboxPublisher(
    {
      claim:async()=>[
        {id:1,eventId:"e1",topic:"ok",payload:{},attempts:0},
        {id:2,eventId:"e2",topic:"bad",payload:{},attempts:0}
      ],
      markPublished:async(id)=>{published.push(id);},
      markFailed:async(id)=>{failed.push(id);}
    },
    {
      publish:async(topic)=>{
        if(topic==="bad") throw new Error("broker unavailable");
      }
    }
  );

  const result=await worker.runOnce("worker-1");
  assert.deepEqual(published,[1]);
  assert.deepEqual(failed,[2]);
  assert.equal(result.published,1);
  assert.equal(result.failed,1);
});
