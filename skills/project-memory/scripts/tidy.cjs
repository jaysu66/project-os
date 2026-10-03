#!/usr/bin/env node
// tidy.cjs — project-memory 整理:列出该归档的会话、该升级的坑、STATE 新鲜度。
// 用法:node <skill>/scripts/tidy.cjs [--apply]   (在项目根执行)
//   默认只读,只打印计划;--apply 才把 30 天前的会话各追加一行到 ARCHIVE/YYYY-QN.md。从不删除任何文件。
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apply = process.argv.includes('--apply');
const cwd = process.cwd();
const DAY = 864e5;

// 定位记忆文件夹:git 公共区锚定(os 多 worktree)优先,否则当前目录
function locate() {
  try {
    const common = execSync('git rev-parse --path-format=absolute --git-common-dir', { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const a = JSON.parse(fs.readFileSync(path.join(common, 'project-os.json'), 'utf8'));
    if (a.ssotDir && fs.existsSync(a.ssotDir)) return a.ssotDir;
  } catch (_) {}
  return path.join(cwd, '.agent-memory');
}
const mem = locate();
if (!fs.existsSync(mem)) { console.log('没有 .agent-memory/,先说"初始化项目记忆"。'); process.exit(0); }
const read = f => { try { return fs.readFileSync(path.join(mem, f), 'utf8'); } catch (_) { return ''; } };
const days = d => Math.floor((Date.now() - new Date(d + 'T00:00:00').getTime()) / DAY);
const out = [];

// ① 会话归档
const archiveDir = path.join(mem, 'ARCHIVE');
const archived = fs.existsSync(archiveDir) ? fs.readdirSync(archiveDir).map(f => read(path.join('ARCHIVE', f))).join('\n') : '';
const sessDir = path.join(mem, 'SESSIONS');
const todo = [];
if (fs.existsSync(sessDir)) {
  for (const f of fs.readdirSync(sessDir).sort()) {
    const m = f.match(/^(\d{4}-\d{2}-\d{2}).*\.md$/);
    if (!m || days(m[1]) <= 30 || archived.includes('SESSIONS/' + f)) continue;
    const text = read(path.join('SESSIONS', f));
    const goal = (text.match(/目标[::]\**\s*(.+)/) || [])[1];
    const first = text.split(/\r?\n/).map(l => l.replace(/^[#>*\-\s]+/, '').trim()).find(Boolean) || '(空)';
    todo.push({ f, date: m[1], summary: (goal || first).replace(/\*+/g, '').slice(0, 80) });
  }
}
out.push(`① 超过 30 天未归档的会话:${todo.length} 份`);
for (const t of todo.slice(0, 20)) out.push(`   - ${t.f}:${t.summary}`);
if (todo.length > 20) out.push(`   - ……另有 ${todo.length - 20} 份`);

// ② 坑升级
const g = read('GOTCHAS.md');
const hot = g.split(/\n(?=## G-)/).filter(b => b.startsWith('## G-')).filter(b => {
  const n = +((b.match(/出现次数[::]\s*(\d+)/) || [])[1] || 0);
  return n >= 3 && !b.includes('已升级为硬约束');
});
out.push(`② 出现 ≥3 次、还没升级的坑:${hot.length} 条`);
for (const b of hot) out.push('   - ' + b.split(/\r?\n/)[0].replace(/^## /, ''));

// ③ 决定
// 新格式 "## D-001 …",旧版 v2 格式 "## 决策:…"
const dBlocks = read('DECISIONS.md').split(/\n(?=## (?:D-|决策))/).filter(b => /^## (?:D-|决策)/.test(b));
const over = dBlocks.filter(b => /已推翻/.test(b)).length;
out.push(`③ 决定:有效 ${dBlocks.length - over} 条,已推翻 ${over} 条`);

// ④ STATE 新鲜度
const s = read('PROJECT-STATE.md');
const sd = (s.split(/\r?\n/).slice(0, 8).join('\n').match(/\d{4}-\d{2}-\d{2}/) || [])[0];
if (!s) out.push('④ 没有 PROJECT-STATE.md' + (read('INDEX.yaml') ? '(有旧版 INDEX.yaml,可说"初始化"升级)' : ''));
else if (!sd) out.push('④ PROJECT-STATE.md 顶部没有更新日期');
else out.push(`④ PROJECT-STATE.md 上次更新 ${sd}(${days(sd)} 天前)${days(sd) > 7 ? ' ⚠️ 超过 7 天,建议刷新' : ''}`);

console.log('🧹 记忆整理' + (apply ? '(执行)' : '(只读计划)') + ':' + mem);
console.log(out.join('\n'));

if (apply && todo.length) {
  fs.mkdirSync(archiveDir, { recursive: true });
  for (const t of todo) {
    const [y, mo] = t.date.split('-');
    const q = `${y}-Q${Math.ceil(+mo / 3)}`;
    const file = path.join(archiveDir, q + '.md');
    if (!fs.existsSync(file)) fs.writeFileSync(file, `# ARCHIVE ${q} — 旧会话一行摘要(原文件仍在 SESSIONS/)\n`, 'utf8');
    fs.appendFileSync(file, `- ${t.date} ${t.summary} → SESSIONS/${t.f}\n`, 'utf8');
  }
  console.log(`已归档 ${todo.length} 份(原文件保留)。坑的升级请按 references/整理.md 手动做。`);
} else if (todo.length) {
  console.log('用户确认后加 --apply 执行归档。');
}
process.exit(0);
