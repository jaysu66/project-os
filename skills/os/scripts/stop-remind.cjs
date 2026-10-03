#!/usr/bin/env node
// stop-remind.cjs — os 的可选 Stop hook:一轮回复结束时,如果有新的工作还没进项目记忆,提醒 Agent 按「收工」记一下。
// 不吵的规则:①有新工作(新提交或未提交改动)比最后一次记忆更新更晚才提醒 ②同一会话 30 分钟内最多一次
//            ③stop_hook_active 时不提醒(防循环)。Agent 记完(SESSIONS/ 或 commit 信更新)就不再提醒。
// 找不到 .agent-memory、不是 git 项目、任何错误 → 静默退出,不阻塞会话。只用 Node.js。
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

let input = {};
try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch (_) {}
const cwd = input.cwd || process.cwd();
const GAP_MS = 30 * 60 * 1000;

function sh(cmd) { try { return execSync(cmd, { cwd, timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trimEnd(); } catch (_) { return ''; } }
function newest(dir) {
  let t = 0;
  try { for (const f of fs.readdirSync(dir)) { const s = fs.statSync(path.join(dir, f)); if (s.isFile()) t = Math.max(t, s.mtimeMs); } } catch (_) {}
  return t;
}

try {
  if (input.stop_hook_active) process.exit(0);
  const top = sh('git rev-parse --show-toplevel').trim();
  if (!top) process.exit(0);

  let mem = '';
  try {
    const a = JSON.parse(fs.readFileSync(path.join(sh('git rev-parse --path-format=absolute --git-common-dir'), 'project-os.json'), 'utf8'));
    if (a.ssotDir && fs.existsSync(a.ssotDir)) mem = a.ssotDir;
  } catch (_) {}
  if (!mem && fs.existsSync(path.join(cwd, '.agent-memory'))) mem = path.join(cwd, '.agent-memory');
  if (!mem) process.exit(0);

  // 最后一次记忆更新:会话日志、commit 信、STATE 里最新的时间
  let lastMemory = Math.max(newest(path.join(mem, 'SESSIONS')), newest(path.join(mem, 'mailbox', 'commits')));
  try { lastMemory = Math.max(lastMemory, fs.statSync(path.join(mem, 'PROJECT-STATE.md')).mtimeMs); } catch (_) {}

  // 最新的工作:最后一次提交 + 未提交改动的文件(记忆文件夹本身不算)
  // 提交时间留 5 分钟容差:先写日志、再把代码和日志一起提交,不算"没记"
  const commitAt = (+sh('git log -1 --format=%ct') || 0) * 1000;
  let lastWork = commitAt - 5 * 60 * 1000;
  const memRel = path.relative(top, mem).replace(/\\/g, '/');
  for (const line of sh('git status --porcelain').split(/\r?\n/).filter(Boolean).slice(0, 50)) {
    const rel = line.slice(3).replace(/^"|"$/g, '').split(' -> ').pop();
    if (memRel && rel.startsWith(memRel)) continue;
    try { lastWork = Math.max(lastWork, fs.statSync(path.join(top, rel)).mtimeMs); } catch (_) {}
  }
  if (!lastWork || lastWork <= lastMemory) process.exit(0);

  // 同一会话 30 分钟内最多提醒一次(标记放系统临时目录,不污染仓库)
  const mark = path.join(os.tmpdir(), 'os-stop-remind-' + String(input.session_id || 'default').replace(/[^\w-]/g, ''));
  try { if (Date.now() - fs.statSync(mark).mtimeMs < GAP_MS) process.exit(0); } catch (_) {}
  fs.writeFileSync(mark, String(Date.now()));

  const reason = '[os] 这段工作还没进项目记忆。按 .agent-memory/PROTOCOL.md 的「收工」简短记一下:'
    + '追加 SESSIONS/今天日期.md(做了什么、遗留、用户这次的纠正),有新决定或坑就追加到 DECISIONS.md / GOTCHAS.md。'
    + '记完直接结束本轮,不要开始别的工作。';
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
} catch (_) { /* fail-soft */ }
process.exit(0);
