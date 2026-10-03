#!/usr/bin/env node
// init.cjs — /os 接入:先建记忆层(调用同级 project-memory 的 init),再建协作层骨架(幂等,已存在的一律跳过)。
// 用法:node <skill>/scripts/init.cjs  (在项目根执行;额外参数原样传给 project-memory 的 init)
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const skillDir = path.resolve(__dirname, '..');
const mem = path.join(root, '.agent-memory');
const made = [], skipped = [];
let memoryLayer = 'project-memory 未安装:只建最小 PROJECT-STATE.md';

// ① 记忆层:同级 project-memory(仓库 skills/ 下或安装目录里都是兄弟目录)
const memInit = path.resolve(skillDir, '..', 'project-memory', 'scripts', 'init.cjs');
if (fs.existsSync(memInit)) {
  try {
    const r = JSON.parse(execFileSync(process.execPath, [memInit, ...process.argv.slice(2)], { cwd: root }).toString('utf8'));
    memoryLayer = { made: r.made, skipped: r.skipped, notes: r.notes };
  } catch (e) { memoryLayer = 'project-memory init 失败:' + e.message; }
}

function put(rel, content) {
  const p = path.join(mem, rel);
  if (fs.existsSync(p)) { skipped.push(rel); return; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  made.push(rel);
}
function fromAsset(name, fallback) {
  try { return fs.readFileSync(path.join(skillDir, 'assets', name), 'utf8'); } catch (_) { return fallback; }
}

// ② 协作层
fs.mkdirSync(path.join(mem, 'charters'), { recursive: true });
fs.mkdirSync(path.join(mem, 'mailbox', 'commits'), { recursive: true });
fs.mkdirSync(path.join(mem, 'epochs'), { recursive: true });
put('PROJECT-STATE.md', '# PROJECT-STATE — 项目总状态(单页,所有会话第一入口)\n\n> 待填:项目一句话 / 当前状态 / 待办 / 文档地图。保持 ≤60 行。\n');
put('MULTI-SESSION-PROTOCOL.md', fromAsset('MULTI-SESSION-PROTOCOL.md', '# 多会话规范(见 os skill)\n'));
put('mailbox/BROADCAST.md', '# BROADCAST — 全员广播(新条目追加在末尾,启动只读最后 3 条)\n');

// ③ STATE 末尾补协作段(已有就跳过)
const statePath = path.join(mem, 'PROJECT-STATE.md');
const MARK = '## 协作(os)';
if (fs.existsSync(statePath)) {
  const s = fs.readFileSync(statePath, 'utf8');
  if (s.includes(MARK) || s.includes('正在并行的方向')) skipped.push('PROJECT-STATE.md 协作段');
  else {
    fs.appendFileSync(statePath, (s.endsWith('\n') ? '\n' : '\n\n') + fromAsset('STATE-os-section.md', MARK + '\n'), 'utf8');
    made.push('PROJECT-STATE.md 协作段(末尾追加)');
  }
}

console.log(JSON.stringify({ ok: true, ssot: mem, memoryLayer, made, skipped }, null, 2));
