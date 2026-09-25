// commit.js：提交与回滚
// 同一提交编号重复出现只算一次，重复次数计入 again。
export function finish(state, commitIds) {
  const seen = new Set();
  let again = 0;
  for (const id of commitIds) {
    if (seen.has(id)) again += 1;
    else seen.add(id);
  }
  return {
    committed: seen.size > 0,
    rolled_back: state.rolledBack || 0,
    writes_kept: Object.keys(state.rows).length,
    again,
  };
}
