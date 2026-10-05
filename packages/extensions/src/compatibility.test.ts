import test from "node:test";
import assert from "node:assert/strict";
import { ExtensionCompatibilityChecker, ExtensionSandboxPolicy } from "./index.js";

test("compatibility blocks unsupported permissions", () => {
  const result=new ExtensionCompatibilityChecker().check({
    id:"mgr.demo",
    version:"1.0.0",
    displayName:"Demo",
    permissions:[{resource:"contacts",actions:["write"]}],
    eventsConsumed:[],
    eventsEmitted:[],
    workflowNodes:[],
    capabilities:[]
  },{
    platformVersion:"0.1.0",
    supportedCapabilities:new Set(),
    grantedPermissions:new Set(),
    supportedWorkflowNodeTypes:new Set()
  });
  assert.equal(result.compatible,false);
  assert.ok(result.blockers.some(item=>item.includes("contacts:write")));
});

test("sandbox denies ungranted action", () => {
  assert.throws(
    ()=>new ExtensionSandboxPolicy().assertAllowed("contacts","write",new Set()),
    /denied/
  );
});
