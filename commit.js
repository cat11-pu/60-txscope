// commit.js：提交与回滚（同一提交编号幂等，重复只计入 again）
export function finish(state, commitIds) {
  const seen = new Set();
  let again = 0;
  for (const id of commitIds || []) {
    if (seen.has(id)) again += 1;
    else seen.add(id);
  }
  return {
    committed: true,
    rolled_back: state.rolled_back || 0,
    writes_kept: Object.keys(state.rows).length,
    again: again,
  };
}
