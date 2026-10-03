#!/usr/bin/env node
// init.cjs — project-memory 初始化:在当前项目建 .agent-memory 必建文件(幂等,已存在的一律跳过)。
// 用法:node <skill>/scripts/init.cjs [--no-entry] [--migrate]   (在项目根执行)
//   --no-entry  不在 CLAUDE.md / AGENTS.md 末尾追加指路
//   --migrate   已有旧版 INDEX.yaml 时,仍然建 PROJECT-STATE.md(INDEX.yaml 保留)
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const root = process.cwd();
const skillDir = path.resolve(__dirname, '..');
const mem = path.join(root, '.agent-memory');
const today = new Date().toISOString().slice(0, 10);
const made = [], skipped = [], notes = [];

function asset(name) {
  return fs.readFileSync(path.join(skillDir, 'assets', name), 'utf8').replace(/YYYY-MM-DD/g, today);
}
function put(rel, content) {
  const p = path.join(mem, rel);
  if (fs.existsSync(p)) { skipped.push(rel); return; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  made.push(rel);
}

fs.mkdirSync(mem, { recursive: true });
const legacyIndex = fs.existsSync(path.join(mem, 'INDEX.yaml'));
if (legacyIndex && !fs.existsSync(path.join(mem, 'PROJECT-STATE.md')) && !args.includes('--migrate')) {
  notes.push('发现旧版 INDEX.yaml:未建 PROJECT-STATE.md。用户同意迁移后加 --migrate 重跑(INDEX.yaml 不会被删)。');
} else {
  put('PROJECT-STATE.md', asset('PROJECT-STATE.template.md'));
}
put('CONTEXT.md', asset('CONTEXT.template.md'));
put('PROTOCOL.md', asset('PROTOCOL.md'));

// 入口指路:追加到 CLAUDE.md / AGENTS.md 末尾(不存在就新建;已有这段就跳过)
const MARK = '## 项目记忆(project-memory)';
const ENTRY = [
  MARK,
  '- 开工先读 `.agent-memory/PROJECT-STATE.md`,再按其中「文档地图」按需读;有 `.agent-memory/PREFERENCES.md` 必读。',
  '- 收工按 `.agent-memory/PROTOCOL.md` 记录:写会话日志、更新 STATE、追加决定/坑/偏好。',
  '- 不知道写 `[待补充]`;决定、坑、偏好、会话日志只追加。',
].join('\n');
if (!args.includes('--no-entry')) {
  for (const name of ['CLAUDE.md', 'AGENTS.md']) {
    const p = path.join(root, name);
    const old = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    if (old.includes(MARK)) { skipped.push(name + '(已有指路)'); continue; }
    // 严格追加:不改原有任何字节,换行符跟随原文件
    const eol = old.includes('\r\n') ? '\r\n' : '\n';
    const sep = !old ? '' : old.endsWith('\n') ? eol : eol + eol;
    fs.appendFileSync(p, sep + ENTRY.replace(/\n/g, eol) + eol, 'utf8');
    made.push(name + (old ? '(末尾追加指路)' : '(新建,仅含指路)'));
  }
}

console.log(JSON.stringify({ ok: true, memoryDir: mem, made, skipped, legacyIndex, notes }, null, 2));
