// commit.js：提交与回滚（基线：每次提交都算一次、不判幂等）
export function finish(state, commitIds) {
  return { committed: true, rolled_back: 0, writes_kept: Object.keys(state.rows).length, again: 0 };
}
