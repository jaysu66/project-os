#!/usr/bin/env node
// sessionstart-nav.cjs — os 的可选 SessionStart hook:新开、恢复、压缩后,自动把项目记忆的入口注入会话。
// 找不到 .agent-memory 就静默退出;任何错误都不阻塞会话(fail-soft)。只用 Node.js,不依赖 bash。
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let input = {};
try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch (_) {}
const cwd = input.cwd || process.cwd();
const source = input.source || 'startup';

function sh(cmd) { try { return execSync(cmd, { cwd, timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trim(); } catch (_) { return ''; } }

try {
  // 定位记忆文件夹:git 公共区锚定优先,否则 cwd/.agent-memory
  let mem = '';
  const common = sh('git rev-parse --path-format=absolute --git-common-dir');
  if (common) {
    try {
      const a = JSON.parse(fs.readFileSync(path.join(common, 'project-os.json'), 'utf8'));
      if (a.ssotDir && fs.existsSync(a.ssotDir)) mem = a.ssotDir;
    } catch (_) {}
  }
  if (!mem && fs.existsSync(path.join(cwd, '.agent-memory'))) mem = path.join(cwd, '.agent-memory');
  if (!mem) process.exit(0);

  const has = f => fs.existsSync(path.join(mem, f));
  const lines = ['[os] 本项目有项目记忆(' + mem + ')。按下面的入口开工,不要全量读取:'];
  if (has('PROJECT-STATE.md')) {
    const head = fs.readFileSync(path.join(mem, 'PROJECT-STATE.md'), 'utf8').split(/\r?\n/).slice(0, 30).join('\n');
    lines.push('- PROJECT-STATE.md(前 30 行如下,需要时再读全文):', head.slice(0, 2500));
  } else if (has('INDEX.yaml')) {
    lines.push('- 先读旧版 INDEX.yaml(可用 /os 接入 升级成 PROJECT-STATE.md)');
  }
  if (has('PREFERENCES.md')) lines.push('- 必读 PREFERENCES.md:用户在本项目纠正过的事。');
  lines.push('- DECISIONS.md、GOTCHAS.md 只读索引里标 [critical] 的行;其余按任务再读。');
  if (source === 'compact') {
    const branch = (sh('git branch --show-current') || 'detached').replace(/[^\w.-]+/g, '-');
    const snap = ['COMPACT-SNAPSHOT-' + branch + '.md', 'COMPACT-SNAPSHOT.md'].find(has);
    if (snap) lines.push('- 刚刚发生了压缩:先读 ' + snap + ',对齐压缩前在做什么;改任何文件前重新读一遍该文件。');
  }
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: lines.join('\n') } }));
} catch (_) { /* fail-soft */ }
process.exit(0);
