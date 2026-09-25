// scope.js：操作序列（保存点用写前日志按需恢复，不做全量快照）
export function run(ops) {
  const rows = {};
  const journal = []; // 每项 [key, had, prev]，回滚时逆向回放
  const savepoints = []; // 每项 { name, mark }，mark 为日志位置
  let rolledBack = 0;

  for (const op of ops) {
    if (op.op === "begin") {
      // 开启作用域：初始层级为零
    } else if (op.op === "write") {
      journal.push([op.key, Object.prototype.hasOwnProperty.call(rows, op.key), rows[op.key]]);
      rows[op.key] = op.value;
    } else if (op.op === "savepoint") {
      savepoints.push({ name: op.name, mark: journal.length });
    } else if (op.op === "rollback") {
      const idx = savepoints.findIndex((sp) => sp.name === op.savepoint);
      if (idx === -1) {
        const err = new Error("E_NO_SAVEPOINT: " + op.savepoint);
        err.code = "E_NO_SAVEPOINT";
        throw err;
      }
      const target = savepoints[idx];
      while (journal.length > target.mark) {
        const [key, had, prev] = journal.pop();
        if (had) rows[key] = prev; else delete rows[key];
      }
      savepoints.length = idx + 1; // 层级降到该保存点
      rolledBack += 1;
    } else if (op.op === "commit") {
      // 提交：作用域结束，保留当前写入
    }
  }

  return {
    rows: rows,
    depth: savepoints.length,
    savepoints: savepoints.map((sp) => sp.name),
    rolled_back: rolledBack,
  };
}
