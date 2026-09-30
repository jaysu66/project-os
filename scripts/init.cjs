#!/usr/bin/env node
// init.cjs — /os 接入:在当前项目建 .agent-memory 骨架(幂等,已存在的文件一律跳过)。
// 用法:node <skill>/scripts/init.cjs  (在项目根执行)
'use strict';
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const skillDir = path.resolve(__dirname, '..');
const mem = path.join(root, '.agent-memory');
const made = [], skipped = [];

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

fs.mkdirSync(path.join(mem, 'charters'), { recursive: true });
fs.mkdirSync(path.join(mem, 'mailbox'), { recursive: true });
fs.mkdirSync(path.join(mem, 'mailbox', 'commits'), { recursive: true });
fs.mkdirSync(path.join(mem, 'epochs'), { recursive: true });

put('PROJECT-STATE.md', fromAsset('PROJECT-STATE.template.md',
  '# PROJECT-STATE — 项目总状态(单页,所有会话第一入口)\n\n> 待填:项目一句话 / 当前版本 / 主仓库与分支 / 方向表 / 铁律 / 文档地图。保持 ≤60 行。\n'));
put('MULTI-SESSION-PROTOCOL.md', fromAsset('MULTI-SESSION-PROTOCOL.md', '# 多会话规范(见 project-os skill)\n'));
put('mailbox/BROADCAST.md', '# BROADCAST — 全员广播(新在上,保留最近 10 条)\n');

console.log(JSON.stringify({ ok: true, ssot: mem, made, skipped }, null, 2));
