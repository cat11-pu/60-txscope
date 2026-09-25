// app.js：渲染结果
import { run } from "./scope.js";
import { finish } from "./commit.js";

export function render(spec) {
  const state = run(spec.ops);
  const done = finish(state, spec.commit_ids || []);
  return { rows: state.rows, depth: state.depth, savepoints: state.savepoints,
           committed: done.committed, rolled_back: done.rolled_back,
           writes_kept: done.writes_kept, again: done.again };
}
