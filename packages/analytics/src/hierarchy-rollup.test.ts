import test from "node:test";
import assert from "node:assert/strict";
import { HierarchyRollupEngine } from "./hierarchy-rollup.js";

test("rolls office revenue into bureau totals", () => {
  const rows=new HierarchyRollupEngine().rollup([
    {nodeId:"bureau",metricKey:"revenue",value:100},
    {nodeId:"office-a",parentId:"bureau",metricKey:"revenue",value:250},
    {nodeId:"office-b",parentId:"bureau",metricKey:"revenue",value:150}
  ]);

  const bureau=rows.find(row=>row.nodeId==="bureau" && row.metricKey==="revenue");
  assert.equal(bureau?.directValue,100);
  assert.equal(bureau?.rolledUpValue,500);
  assert.equal(bureau?.descendantCount,2);
});
