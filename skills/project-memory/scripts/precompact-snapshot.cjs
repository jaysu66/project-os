#!/usr/bin/env node
// precompact-snapshot.cjs — project-memory 的可选 PreCompact hook(全局装一次):压缩前把项目状态确定性落盘。
// os v2:锚定优先(git 公共区 project-os.json),cwd .agent-memory 兜底;快照按分支分名
// COMPACT-SNAPSHOT-<branch>.md,多会话并行互不覆盖。非项目会话毫秒级静默退出。
// fail-soft:任何错误绝不阻塞压缩。本机铁律:hook 只能 node(bash=WSL 坏)。
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let input = '';
try { input = fs.readFileSync(0, 'utf8'); } catch (_) {}
let cwd = process.cwd();
try { const j = JSON.parse(input || '{}'); if (j.cwd) cwd = j.cwd; } catch (_) {}

function sh(cmd, dir) { try { return execSync(cmd, { cwd: dir, timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trim(); } catch (_) { return ''; } }

try {
  // 定位 SSOT:①git 公共区锚定(优先,防 worktree 分叉副本) ②cwd 直下兜底
  let ssot = '';
  const common = sh('git rev-parse --path-format=absolute --git-common-dir', cwd);
  if (common) {
    try {
      const anchor = JSON.parse(fs.readFileSync(path.join(common, 'project-os.json'), 'utf8'));
      if (anchor.ssotDir && fs.existsSync(path.join(anchor.ssotDir, 'PROJECT-STATE.md'))) ssot = anchor.ssotDir;
    } catch (_) {}
  }
  if (!ssot) {
    const local = path.join(cwd, '.agent-memory');
    if (fs.existsSync(path.join(local, 'PROJECT-STATE.md'))) ssot = local;
  }
  if (!ssot) process.exit(0); // 非 project-os 项目,零打扰

  // 快照按分支分名,多会话/多 worktree 并行互不覆盖
  const branch = sh('git branch --show-current', cwd) || 'detached';
  const safe = branch.replace(/[^\w.-]+/g, '-');
  const file = path.join(ssot, `COMPACT-SNAPSHOT-${safe}.md`);

  const snap = [
    `# COMPACT-SNAPSHOT(分支 ${branch})— 压缩前自动快照(PreCompact hook)`,
    `> 时间:${new Date().toISOString()};会话 cwd:${cwd}`,
    '> 恢复后:先读 PROJECT-STATE.md,再用本页对齐"压缩瞬间在干什么"。本快照只描述上述 cwd 的状态。',
    '',
    '## git 最近 5 commit',
    '```', sh('git log --oneline -5', cwd) || '(非 git 目录)', '```',
    '## git 未提交(脏=有半成品,恢复后先处置)',
    '```', sh('git status --short', cwd) || '(干净)', '```',
    '## 分支',
    '```', branch, '```',
  ].join('\n');
  fs.writeFileSync(file, snap, 'utf8');
  process.stdout.write('[project-os] 压缩快照已落盘 ' + file + '\n');
} catch (_) { /* fail-soft */ }
process.exit(0);
