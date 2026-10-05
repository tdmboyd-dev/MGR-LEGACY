import test from "node:test";
import assert from "node:assert/strict";
import { CommsCommand } from "./comms-command.js";

test("unanswered negative message escalates and replies", () => {
  const result=new CommsCommand().recommend({
    contactId:"c1",
    threadId:"t1",
    channel:"sms",
    lastInboundAt:"2026-10-04T00:00:00.000Z",
    unansweredInbound:true,
    negativeSentiment:true
  },new Date("2026-10-05T00:00:00.000Z"));

  assert.equal(result[0]!.type,"escalate");
  assert.ok(result.some(item=>item.type==="reply"));
});
