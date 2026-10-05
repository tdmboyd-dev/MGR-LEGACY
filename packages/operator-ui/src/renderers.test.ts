import test from "node:test";
import assert from "node:assert/strict";
import { renderCommandPalette, renderTruthConsole } from "./renderers.js";

test("truth console renderer escapes content",()=>{
  const html=renderTruthConsole([{
    receiptId:"r1",at:"2026-10-05T00:00:00.000Z",actorId:"a1",
    action:"<script>alert(1)</script>",status:"succeeded",executionMode:"ask",
    policyDecision:"allow",approvalCount:0,evidenceKeys:[]
  }]);
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.equal(html.includes("<script>alert(1)</script>"),false);
});

test("command palette renderer emits command metadata",()=>{
  const html=renderCommandPalette({
    query:"contact",
    recentCommandIds:[],
    pinnedCommandIds:[],
    commands:[{
      id:"contact.update",label:"Update contact",description:"Edit contact fields",
      action:"crm.update_contact",keywords:["contact"],scopeTypes:["organization"],risk:"medium"
    }]
  });
  assert.ok(html.includes('data-command-id="contact.update"'));
  assert.ok(html.includes('data-action="crm.update_contact"'));
});
