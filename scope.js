// scope.js：操作序列
// begin 开启作用域；savepoint 记下层级与写入快照位置；write 写入；
// rollback 丢掉该保存点之后的写入并把层级降回该保存点。
//
// 预算：保存点不做全量快照。所有写入共用一条撤销日志（undo log），
// 每条 write 只追加一条旧值记录；保存点仅记录当时的日志长度与层级，
// 十万次写入也只产生十万条定长记录，不存在按保存点复制整表的开销。

function noSavepoint(name) {
  const err = new Error("savepoint not found: " + name);
  err.code = "E_NO_SAVEPOINT";
  return err;
}

export function run(ops) {
  const rows = {};
  // 撤销日志：{ key, present, old }，present 标记写入前该键是否已存在
  const undoLog = [];
  // 保存点栈：{ name, depth, logIndex }
  const savepoints = [];
  let depth = 0;
  let rolledBack = 0;
  let requestedCommit = false;

  for (const op of ops) {
    switch (op.op) {
      case "begin":
        depth += 1;
        break;

      case "savepoint":
        savepoints.push({ name: op.name, depth, logIndex: undoLog.length });
        depth += 1;
        break;

      case "write": {
        const present = Object.prototype.hasOwnProperty.call(rows, op.key);
        undoLog.push({ key: op.key, present, old: rows[op.key] });
        rows[op.key] = op.value;
        break;
      }

      case "rollback": {
        const index = savepoints.findIndex((sp) => sp.name === op.savepoint);
        if (index === -1) throw noSavepoint(op.savepoint);
        const target = savepoints[index];
        // 逆序撤销该保存点之后的全部写入，再截断日志
        for (let i = undoLog.length - 1; i >= target.logIndex; i -= 1) {
          const entry = undoLog[i];
          if (entry.present) rows[entry.key] = entry.old;
          else delete rows[entry.key];
        }
        undoLog.length = target.logIndex;
        // 丢掉该保存点之后建立的保存点，层级降回该保存点
        savepoints.length = index + 1;
        depth = Math.max(0, target.depth);
        rolledBack += 1;
        break;
      }

      case "commit":
        requestedCommit = true;
        break;

      default:
        break;
    }
  }

  return {
    rows,
    depth,
    savepoints: savepoints.map((sp) => sp.name),
    rolledBack,
    requestedCommit,
  };
}
