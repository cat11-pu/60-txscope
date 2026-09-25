// scope.js：操作序列（基线：写入直接生效、不看保存点）
export function run(ops) {
  const rows = {};
  for (const op of ops) {
    if (op.op === "write") rows[op.key] = op.value;
  }
  return { rows: rows, depth: 0, savepoints: [] };
}
