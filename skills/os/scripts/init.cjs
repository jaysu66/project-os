#!/usr/bin/env node
// init.cjs — /os 接入:建 .agent-memory 记忆文件 + 协作骨架 + 入口指路(幂等,已存在的一律跳过,只追加不改写)。
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

// ① 记忆
fs.mkdirSync(mem, { recursive: true });
const legacyIndex = fs.existsSync(path.join(mem, 'INDEX.yaml'));
if (legacyIndex && !fs.existsSync(path.join(mem, 'PROJECT-STATE.md')) && !args.includes('--migrate')) {
  notes.push('发现旧版 INDEX.yaml:未建 PROJECT-STATE.md。用户同意迁移后加 --migrate 重跑(INDEX.yaml 不会被删)。');
} else {
  put('PROJECT-STATE.md', asset('PROJECT-STATE.template.md'));
}
put('CONTEXT.md', asset('CONTEXT.template.md'));
put('PROTOCOL.md', asset('PROTOCOL.md'));

// ② 协作骨架
for (const d of ['charters', 'mailbox/commits', 'epochs']) fs.mkdirSync(path.join(mem, d), { recursive: true });
put('MULTI-SESSION-PROTOCOL.md', asset('MULTI-SESSION-PROTOCOL.md'));
put('mailbox/BROADCAST.md', '# BROADCAST — 全员广播(新条目追加在末尾,启动只读最后 3 条)\n');

// ③ 入口指路:严格追加到 CLAUDE.md / AGENTS.md 末尾(不存在就新建;已有本段或旧版协议段就跳过)
const MARK = '## 项目记忆与协作(os)';
const OLD_MARK = '## project-os 会话协议';
const ENTRY = [
  MARK,
  '- 开工先读 `.agent-memory/PROJECT-STATE.md`,再按其中「文档地图」按需读;有 `.agent-memory/PREFERENCES.md` 必读。',
  '- 收工按 `.agent-memory/PROTOCOL.md` 记录:写会话日志、更新 STATE、追加决定/坑/偏好。不知道写 `[待补充]`;决定、坑、偏好、会话日志只追加。',
  '- 同时开多个会话时按 `.agent-memory/MULTI-SESSION-PROTOCOL.md`:改主线先拿 `locks/主线.lock.md`;每次 commit 后写 commit 信到 `mailbox/commits/<方向名>.md`;维护 STATE 只归主 agent。',
].join('\n');
if (!args.includes('--no-entry')) {
  for (const name of ['CLAUDE.md', 'AGENTS.md']) {
    const p = path.join(root, name);
    const old = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    if (old.includes(MARK) || old.includes(OLD_MARK)) { skipped.push(name + '(已有指路)'); continue; }
    const eol = old.includes('\r\n') ? '\r\n' : '\n';
    const sep = !old ? '' : old.endsWith('\n') ? eol : eol + eol;
    fs.appendFileSync(p, sep + ENTRY.replace(/\n/g, eol) + eol, 'utf8');
    made.push(name + (old ? '(末尾追加指路)' : '(新建,仅含指路)'));
  }
}

console.log(JSON.stringify({ ok: true, ssot: mem, made, skipped, legacyIndex, notes }, null, 2));
