import assert from "node:assert";
import { run } from "../scope.js";
import { finish } from "../commit.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("run returns rows", () => {
  assert.strictEqual(typeof run([]).rows, "object");
});

check("run returns savepoints", () => {
  assert.ok(Array.isArray(run([]).savepoints));
});

check("finish reports again count", () => {
  assert.strictEqual(typeof finish({ rows: {} }, []).again, "number");
});

check("finish reports writes kept", () => {
  assert.strictEqual(typeof finish({ rows: {} }, []).writes_kept, "number");
});

check("render exposes depth", () => {
  assert.strictEqual(typeof render({ ops: [], commit_ids: [] }).depth, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
