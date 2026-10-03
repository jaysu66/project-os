# project-os

让 AI Agent 记住你的项目:新开一个会话、换一个 Agent,读一页就能接着干,还记得你纠正过它什么。
同时开好几个窗口干活时,互相不覆盖。

> **English**: One plain-Markdown skill (`os`) for Claude Code, Codex and other agents. It keeps a project's
> memory in `.agent-memory/` — one entry page, preferences, decisions, gotchas, session logs — so any new session
> catches up by reading one page, and adds multi-session collaboration (locks, commit letters, mailboxes,
> charters, compaction snapshots) on the same folder. No database, no service — just Markdown, Git and optional Node.js scripts.

## 它解决什么

| 问题 | os 怎么做 |
|---|---|
| 每次新开 AI 都要重讲一遍项目 | 项目记忆写进 `.agent-memory/`,新会话先读一页 `PROJECT-STATE.md` |
| 纠正过的错,下次又犯 | 你的纠正写进 `PREFERENCES.md`,每次开工必读 |
| 想清楚的决定被下一个 Agent 推翻 | `DECISIONS.md` 写明"除非什么情况,否则不要推翻" |
| 对话一压缩就丢细节 | 收工写会话日志;压缩前 hook 自动留快照 |
| 同时开几个窗口,互相覆盖 | 锁、commit 信、信箱、并行方向说明页 |
| 换成 Codex 或别的 Agent 记忆带不走 | 全是仓库里的 Markdown,哪个 Agent 都能读 |

## 安装

```bash
git clone https://github.com/jaysu66/project-os.git
cp -r project-os/skills/os ~/.claude/skills/      # Claude Code
cp -r project-os/skills/os ~/.codex/skills/       # Codex(可选)
cp -r project-os/skills/os ~/.agents/skills/      # 通用 Agents(可选)
```

文件夹名保持 `os`。脚本需要 Node.js 18+;不装 Node.js 也能用,Agent 会按文档手动建文件。

## 三句话用起来

1. 在项目里说:**"帮我记录一下这个项目"**(或 `/os 接入`)—— 问你最多 7 个问题,建好记忆文件夹。
2. 收工时说:**"今天结束了,记一下"**(或 `/os 收工`)—— 写会话日志,记下新的决定、坑和你的纠正。
3. 下次新开会话说:**"上次做到哪了"**(或 `/os 启动`)—— 读一页,给你一份归位报告。

只开一个窗口,用这三句就够了。同时开多个窗口时,再用下面的协作命令。

## 全部命令

| 记忆(每个项目都用) | 做什么 |
|---|---|
| `/os 接入` | 建记忆文件夹和协作骨架,在 `CLAUDE.md`、`AGENTS.md` 末尾写一句指路 |
| `/os 启动` | 读状态页、偏好、关键决定和坑 → 归位报告 |
| `/os 收工` | 写会话日志,更新状态页,追加决定、坑、偏好 |
| `/os 整理` | 列出该归档的旧会话、该升级的坑;你确认后才执行,从不删除 |

| 协作(多个会话、多个 Agent) | 做什么 |
|---|---|
| `/os 开方向 <名>` | 自动建 worktree + 方向说明页,任何 Agent 贴一份就能接活 |
| `/os 收割` | 主 Agent 汇总各会话的 commit 信,更新状态页 |
| `/os 信箱` / `/os 广播` | 会话之间传话 / 通知所有会话 |
| `/os 接管` | 换账号、换工具时接任主 Agent |
| `/os 体检` | 只读检查:锚定、分叉副本、入口、锁、记忆文件 |
| `/os 清洗` / `/os 纪元` | 把宿主记忆收进项目 / 大重构时封存旧状态 |
| `/os 联动` / `/os 矩阵` | 跨项目传话 / 读产品注册表(可选) |

## 每个文件存什么、为什么

```
.agent-memory/
├── PROJECT-STATE.md   唯一入口:现在到哪、待办、最近会话、文档地图(≤60 行)
├── CONTEXT.md         很少变的:项目是什么、怎么跑、硬约束
├── PROTOCOL.md        开工读什么、收工写什么
├── PREFERENCES.md     你在本项目纠正过它什么
├── DECISIONS.md       决定:索引 + 详条,写明"除非什么情况否则不推翻"
├── GOTCHAS.md         坑:索引 + 详条,出现 3 次升级为硬约束
├── RUNBOOK.md         部署、回滚、报错速查
├── SESSIONS/          每次收工一份
├── ARCHIVE/           30 天前的会话,一份一行
├── COMPACT-SNAPSHOT-<分支>.md   压缩前快照
│   —— 以下是协作文件 ——
├── MULTI-SESSION-PROTOCOL.md    多会话规矩
├── charters/          并行方向说明页
├── mailbox/           commits/(commit 信)、会话间信箱、BROADCAST.md
├── locks/             谁在改主线
└── epochs/            大重构封存
```

| 文件 | 存什么 | 为什么 |
|---|---|---|
| `PROJECT-STATE.md` | 一句话、当前状态、正在做、待办、最近 3 次会话、文档地图 | 新会话第一个读,10 秒知道该读什么 |
| `CONTEXT.md` | 项目是什么、怎么跑、技术栈、外部服务、硬约束 | 不常变的和常变的分开,不容易过时 |
| `PREFERENCES.md` | 你说过的"不要这样""我更喜欢""以后都这样",带日期和出处 | Agent 最该记住的,是你纠正过它什么 |
| `DECISIONS.md` | 背景、决定、没选的方案和理由、代价、**除非什么情况否则不推翻** | 防止下一个 Agent 推翻想清楚的决定 |
| `GOTCHAS.md` | 现象、根因、解法、涉及文件、可重跑的命令、出现次数 | 同一个坑不踩第二次;踩 3 次变成规矩 |
| `SESSIONS/` | 目标、完成、问题和解法、遗留、新发现、偏好信号 | 接着干时只读最新 1~2 份 |
| commit 信 | 改动点、**你拍板了什么**、**为什么这样设计** | git 只记改了什么,不记为什么 |

## Hook(可选,默认关)

不装 hook 也能用:压缩前说一句"收工"(会话中途也行),Agent 会把这次的进展、决定和你的纠正记下来。

想让它自动,把下面这段加进 Claude Code 的 `~/.claude/settings.json`(全局)或项目里的 `.claude/settings.json`,
路径换成你的 `os` 文件夹位置:

```json
{
  "hooks": {
    "PreCompact": [
      { "matcher": "auto|manual", "hooks": [{ "type": "command", "command": "node \"C:/Users/you/.claude/skills/os/scripts/precompact-snapshot.cjs\"" }] }
    ],
    "SessionStart": [
      { "matcher": "startup|resume|compact", "hooks": [{ "type": "command", "command": "node \"C:/Users/you/.claude/skills/os/scripts/sessionstart-nav.cjs\"" }] }
    ]
  }
}
```

| Hook | 什么时候 | 做什么 |
|---|---|---|
| PreCompact | 对话压缩前 | 把时间、最近 5 个提交、未提交改动写进 `COMPACT-SNAPSHOT-<分支>.md`——压缩摘要会丢细节,这份只记客观事实 |
| SessionStart | 新开、恢复、压缩后 | 自动把状态页前 30 行、偏好提醒、压缩快照位置塞进会话——Agent 不用"记得去读",一开始就看到了 |

两个脚本都只用 Node.js,找不到 `.agent-memory` 就什么都不做,出错也不会卡住会话。
目前只支持 Claude Code;Codex 等没有同样 hook 的 Agent 用手动方式。

## 设计来源:照着 Claude 的记忆机制

1. **先读一页,再按需读**:像 CLAUDE.md 和记忆索引,入口短、正文用到再读,省 token 也不被旧内容带偏。
2. **记你纠正过什么**:最值得长期记住的不是项目细节,而是用户的纠正和偏好,而且要写"为什么"。
3. **只记查不到的**:git 能查到的不记;记 git 记不住的——你拍板了什么、为什么。

另外两条是踩坑后加的:**靠 Agent 自觉的整理从来不会发生**,所以归档、升级做成明确的命令和脚本;
**入口要放在 Agent 一定会读的地方**,所以接入时在 `CLAUDE.md`、`AGENTS.md` 末尾写一句指路。

## 目录

```
skills/os/
├── SKILL.md          命令路由 + 铁律
├── references/       每个命令一页 + 文件说明
├── assets/           状态页、全景、偏好、决定、坑、会话、运维模板 + 两份规矩 + 方向说明页模板
└── scripts/          init.cjs / tidy.cjs / os-doctor.cjs + 两个可选 hook:precompact-snapshot.cjs / sessionstart-nav.cjs
```

## 副作用与安全边界

- `init.cjs` 只创建缺失的文件,不覆盖已有内容;在项目根 `CLAUDE.md`、`AGENTS.md` 末尾追加一段指路(`--no-entry` 可跳过),原有内容一个字节都不改。
- `tidy.cjs` 默认只读;加 `--apply` 才写 `ARCHIVE/`,从不删除文件。
- `os-doctor.cjs` 只读,退出码始终为 0。
- 两个 hook 脚本默认不装,不会自动注册;`precompact-snapshot.cjs` 会写入本机路径和 Git 状态,不要把快照提交到公开仓库。
- 不读取或上传凭据,不访问外部服务,不修改全局 Agent 配置。
- 旧版的 `INDEX.yaml`、`AGENT_PROTOCOL.md` 仍可读,不会被删除。

## 卸载

从 Skill 目录删除 `os` 文件夹即可。项目里已生成的 `.agent-memory/` 不会被自动删除。

## 许可

MIT,见 [LICENSE](LICENSE)。
