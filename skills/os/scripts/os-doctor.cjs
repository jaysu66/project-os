#!/usr/bin/env node
// os-doctor.cjs — project-os 健康体检(只读,不修任何东西)。
// 用法:在项目任意目录 `node <skill-dir>/scripts/os-doctor.cjs`
// 检查:①锚定有效 ②worktree 分叉副本 ③可选项目入口协议 ④锁状态 ⑤记忆层文件
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
function sh(cmd, dir) { try { return execSync(cmd, { cwd: dir || cwd, timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trim(); } catch (_) { return ''; } }
const out = [];
let warn = 0;
function ok(s) { out.push('  ✅ ' + s); }
function bad(s) { out.push('  ⚠️ ' + s); warn++; }

// ① 锚定
const common = sh('git rev-parse --path-format=absolute --git-common-dir');
let ssot = '';
if (!common) { bad('当前目录不在 git 仓库内'); }
else {
  try {
    const anchor = JSON.parse(fs.readFileSync(path.join(common, 'project-os.json'), 'utf8'));
    if (anchor.ssotDir && fs.existsSync(path.join(anchor.ssotDir, 'PROJECT-STATE.md'))) {
      ssot = anchor.ssotDir;
      ok('锚定有效:' + ssot);
    } else bad('project-os.json 存在但 ssotDir 无 PROJECT-STATE.md:' + (anchor.ssotDir || '(空)'));
  } catch (_) { bad('git 公共区无 project-os.json(未接入或锚定丢失)'); }
}

// ② worktree 分叉副本(有 PROJECT-STATE.md 且非墓碑、非锚定路径)
if (common) {
  const wt = sh('git worktree list --porcelain').split(/\r?\n/).filter(l => l.startsWith('worktree ')).map(l => l.slice(9));
  let forks = 0;
  for (const w of wt) {
    const p = path.join(w, '.agent-memory', 'PROJECT-STATE.md');
    if (!fs.existsSync(p)) continue;
    if (ssot && path.resolve(path.dirname(p)) === path.resolve(ssot)) continue;
    let head = '';
    try { head = fs.readFileSync(p, 'utf8').slice(0, 80); } catch (_) {}
    if (head.includes('已作废') || head.includes('搬家')) continue; // 墓碑
    bad('分叉 STATE 副本:' + p);
    forks++;
  }
  if (!forks) ok('无分叉 STATE 副本(墓碑不算)');
}

// ③ 项目入口协议(可选,不绑定某个 agent 宿主)
const top = sh('git rev-parse --show-toplevel');
if (top) {
  const entry = ['AGENTS.md', 'CLAUDE.md'].find(name => fs.existsSync(path.join(top, name)));
  if (entry) ok('发现项目入口协议:' + entry);
  else ok('未配置项目入口协议(可选)');
}

// ④ 锁状态
if (ssot) {
  const locksDir = path.join(ssot, 'locks');
  const locks = fs.existsSync(locksDir) ? fs.readdirSync(locksDir).filter(f => f.endsWith('.lock.md')) : [];
  if (!locks.length) ok('无活动锁(主线空闲)');
  for (const f of locks) {
    const fp = path.join(locksDir, f);
    const ageH = Math.round((Date.now() - fs.statSync(fp).mtimeMs) / 36e5);
    const first = (fs.readFileSync(fp, 'utf8').split(/\r?\n/).find(l => l.trim()) || '').slice(0, 60);
    if (ageH > 24) bad(`锁 ${f} 已 ${ageH}h 未更新(疑似遗弃):${first}`);
    else ok(`锁 ${f}(${ageH}h 前):${first}`);
  }
}

// ⑤ 记忆层(project-memory):必建文件 + 旧版 INDEX.yaml
const memDir = ssot || path.join(cwd, '.agent-memory');
if (fs.existsSync(memDir)) {
  const missing = ['PROJECT-STATE.md', 'CONTEXT.md', 'PROTOCOL.md'].filter(f => !fs.existsSync(path.join(memDir, f)));
  if (missing.length) ok('记忆层缺 ' + missing.join('、') + '(可选:说"初始化项目记忆"补齐,不覆盖已有文件)');
  else ok('记忆层必建文件齐全');
  if (fs.existsSync(path.join(memDir, 'INDEX.yaml'))) {
    if (fs.existsSync(path.join(memDir, 'PROJECT-STATE.md'))) ok('旧版 INDEX.yaml 仍在,以 PROJECT-STATE.md 为准(INDEX.yaml 不用删)');
    else bad('只有旧版 INDEX.yaml、没有 PROJECT-STATE.md:说"初始化项目记忆"按提示迁移');
  }
}

console.log('🩺 os 体检报告(' + new Date().toISOString().slice(0, 16) + ')');
console.log(out.join('\n'));
console.log(warn ? `结论:⚠️ ${warn} 项需处理` : '结论:✅ 全部健康');
process.exit(0);
