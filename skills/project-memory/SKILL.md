---
name: project-memory
description: >
  项目记忆:把项目上下文写进 .agent-memory/ 文件夹,让任何新会话、任何 Agent 用最少的读取接着干,
  并记住用户纠正过什么。This skill should be used when the user wants an agent to remember a
  project across sessions, or says any of:"帮我记录一下这个项目"、"初始化项目记忆"、"保存上下文"、
  "整理项目信息"、"上次做到哪了"、"帮我了解一下这个项目"、"读一下项目记忆"、"我要继续开发"、
  "今天结束了帮我记一下"、"记录今天的工作"、"收工"、"整理记忆"、"remember this project"、
  "save context"、"where did we leave off"。Also use it proactively at the start of work in any
  project that has .agent-memory/PROJECT-STATE.md or .agent-memory/INDEX.yaml, and before a
  session ends after meaningful work.
---

# project-memory — 项目记忆

按用户的话查下表,Read 对应 references 文件,照步骤执行。一次只读一个 references 文件。

| 用户说 | 读这个文件 | 做什么 |
|---|---|---|
| 帮我记录一下这个项目 / 初始化项目记忆 | references/初始化.md | 问最多 7 个问题,建 3 个必建文件,在 CLAUDE.md、AGENTS.md 末尾追加指路 |
| 今天结束了记一下 / 收工 / 保存上下文 | references/收工.md | 写会话日志,更新 STATE,追加决定、坑、偏好 |
| 上次做到哪了 / 帮我了解这个项目 / 继续开发 | references/上手.md | 分层读取,输出 200 字以内的上手简报 |
| 整理记忆 | references/整理.md | 跑 tidy 脚本:先列计划,用户确认后归档 |
| 每个文件存什么、为什么 | references/文件说明.md | 文件职责与写法 |

## 记忆文件夹(位置:项目根 `.agent-memory/`)

```
.agent-memory/
├── PROJECT-STATE.md   必建 · 唯一入口:现在到哪、待办、文档地图(≤60 行)
├── CONTEXT.md         必建 · 很少变的:项目是什么、怎么跑、硬约束
├── PROTOCOL.md        必建 · 开工读什么、收工写什么
├── PREFERENCES.md     按需 · 用户在本项目纠正过什么
├── DECISIONS.md       按需 · 决定:索引 + 详条,写明"除非什么情况否则不推翻"
├── GOTCHAS.md         按需 · 坑:索引 + 详条,出现 3 次升级为硬约束
├── RUNBOOK.md         按需 · 部署、回滚、报错速查
├── SESSIONS/          按需 · 每次收工一份
└── ARCHIVE/           按需 · 30 天前的会话,一份一行
```

## 铁律

- 先读一页,再按需读。不全量加载;只有标 `[critical]` 的决定和坑每次都读。
- 决定、坑、偏好、会话日志只追加。推翻决定 = 追加新条目 + 旧条目状态改"已推翻"(唯一允许改旧内容的地方)。
- 不知道写 `[待补充]`,不留空白,不编造。
- git 能查到的不记(改了哪几行、提交历史);记 git 记不住的:用户拍板了什么、为什么。
- 只对本项目有效的偏好写 PREFERENCES.md;跨项目的偏好交给宿主自己的记忆(如果有)。
- 整理(归档、升级)只在用户说"整理记忆"时做,先给计划再动手。

## 脚本(Node.js 18+,都在 scripts/)

- `init.cjs`:建骨架,已存在的文件一律跳过。
- `tidy.cjs`:整理计划;默认只读,加 `--apply` 才写 ARCHIVE,从不删除。
- `precompact-snapshot.cjs`:可选的 PreCompact hook,压缩前把 git 现场写进记忆文件夹。

多个会话或多个 Agent 同时改同一个项目时,再装同仓库的 `os` Skill(协作层),它建立在本 Skill 的文件之上。
