import fs from "node:fs";
import { run } from "./scope.js";
import { finish } from "./commit.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/tx.json", "utf8"));
const state = run(spec.ops);
const done = finish(state, spec.commit_ids || []);
const view = render(spec);

emit("提交后的内容 =", state.rows);
emit("保存点层级 =", state.depth);
emit("保存点列表 =", state.savepoints);
emit("是否提交成功 =", done.committed);
emit("回滚次数 =", done.rolled_back);
emit("保留的写入数 =", done.writes_kept);
emit("重复提交被忽略的次数 =", done.again);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  const bad = run([{ op: "begin" }, { op: "rollback", savepoint: "sp9" }]);
  emit("保存点不存在的错误码", bad.rolled_back === 0 ? (bad.code || "no-code") : "no-error");
} catch (error) {
  emit("保存点不存在的错误码", error.code || error.message);
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "提交后的内容": {
    "a": 1,
    "b": 2,
    "d": 4
  },
  "保存点层级": 2,
  "保存点列表": [
    "sp0",
    "sp1"
  ],
  "是否提交成功": true,
  "回滚次数": 1,
  "保留的写入数": 3,
  "重复提交被忽略的次数": 1
};
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (JSON.stringify(got) === JSON.stringify(want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
