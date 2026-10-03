---
name: os
description: >
  project-os 项目开发操作系统 — 多会话并行开发的统一命令入口(中文动词)。
  This skill should be used when the user types "/os" followed by a Chinese verb,
  or says any of: "启动"(会话归位报告)、"接管"(接任主 agent)、"收割"(汇总各方向进展)、
  "信箱"/"查信箱"(会话间传话)、"开方向"(新并行方向 charter)、"广播"、
  "接入 project-os"(新项目初始化)、"清洗记忆"、"开纪元"(底层重构换代)、"帮助"。
  Also trigger when a session needs to orient itself in a project that has
  .agent-memory/PROJECT-STATE.md, when the user asks "项目现在什么状态"、
  "上次做到哪"、"归位", or when taking over as main session after account/tool switch.
---

# /os — 项目开发操作系统(命令路由)

统一规则:**按动词查下表,Read 对应 references 文件,严格照步骤执行,不自由发挥。**
所有产物写入项目 SSOT(位置以「定位 SSOT」结果为准,见下)。
本 Skill 是协作层,建立在同仓库 `project-memory`(记忆层)的文件之上:PROJECT-STATE、CONTEXT、PREFERENCES、
DECISIONS、GOTCHAS、SESSIONS 的写法以 project-memory 为准。没装 project-memory 时照常运行,只是没有这些记忆文件。

## 动词路由表

| 用户说 | 读这个文件 | 一句话职责 |
|---|---|---|
| 启动 | references/启动.md | 读 STATE+广播+锁 → 输出 12 行归位报告 → 停下等需求 |
| 接管 | references/接管.md | 接任主 agent:核对半成品 → 接管报告 → 登记+广播 |
| 收割 | references/收割.md | 主 agent:吃 commit 信+汇总各 charter → 更新 STATE → 验收产出 |
| 信箱 | references/信箱.md | 读本会话身份的信箱,按 REQUEST/DISCUSSION/HANDOFF_LOG 约定应答 |
| 开方向 <名> | references/开方向.md | 从模板生成 charter,登记进 STATE |
| 广播 | references/广播.md | 追加一条到 mailbox/BROADCAST.md |
| 接入 | references/接入.md | 新项目建 .agent-memory 骨架 + 锚定 + 入口文件 |
| 清洗 | references/清洗.md | A 档索引级记忆清洗(原文件不删) |
| 纪元 <名> | references/纪元.md | 封存旧状态到 epochs/,STATE 重写新纪元首版 |
| 矩阵 [产品名] | references/矩阵.md | 读取用户指定的本地产品注册表(可选) |
| 联动 <产品> <事> | references/联动.md | 跨项目协作:往对方宿主 mailbox 写 REQUEST |
| 体检 | references/体检.md | 跑 os-doctor 脚本:分叉副本/skills一致/协议版本/锁 健康检查 |
| 帮助 | (不读文件) | 把上面这张表原样打给用户 |

## 自然语言兜底(用户不必记动词)

`/os` 后面跟的若不是上表动词而是自然语言描述(如"帮我汇总一下各方向进展"),
**按语义匹配上表最接近的一个动词**,然后照常走该动词的 references;
匹配置信不足时,把路由表打给用户让其选择,**绝不自由发挥**。

## 定位 SSOT(所有动词的第 0 步,锚定优先)

1. `git rev-parse --path-format=absolute --git-common-dir` → 读该目录下 `project-os.json` 的 `ssotDir`(多 worktree 唯一锚定),其中存在 `PROJECT-STATE.md` → 就是它。
2. 无锚定文件 → 当前目录 `.agent-memory/PROJECT-STATE.md`(单 worktree 小项目兜底)。
3. 都没有 → 告诉用户"本项目未接入 project-os,要跑 /os 接入 吗",停。
4. ⚠️ 锚定命中后,若 cwd 下**另有**一份 `.agent-memory/PROJECT-STATE.md`(≠锚定路径)→ 那是历史分叉副本:不读它,并在报告里提醒用户清理(体检会抓)。

## 平台边界

本 Skill 只依赖 Node.js、Git(使用 Git 项目时)和 Markdown 文件。`scripts/os-doctor.cjs`、
`project-memory/scripts/precompact-snapshot.cjs` 是可选的本地辅助脚本，不会自动修改全局配置；它们不要求
Claude Code、Codex、特定 IDE 或云服务。若目标环境没有某个平台的 hook、入口文件或 MCP，跳过
对应检查并报告“未配置”，不要伪造通过。

## 铁律(所有动词共守)

- 每个会话都是**项目负责人**,但**写权跟着 worktree 走**(并发产权):一个 worktree 同时只有一个写会话。改主线前先看 `<SSOT>/locks/`——有人持锁就别碰主线(在自己方向 worktree 干活,交 commit 信);主线空闲则写 `locks/主线.lock.md`(谁/何时/在干什么)认领,收工删除。每次 git commit 后必须写「commit 信」到 `<SSOT>/mailbox/commits/<方向名>.md`(**shell 真追加,禁整文件重写**;内容=改动点 + 用户关键决策 + 为什么这样设计),同步给主 agent。
- **打包、发版、收割汇总、维护 PROJECT-STATE 只归主 agent**(用户明示的那个会话,或走「接管」)。Edit 工具报"找不到 old_string"= 可能有并发改动:重新 Read 再改,不要硬凑。
- 省 token:只读路由表指到的那一个 references 文件;STATE 单页;报告 12 行;不复读历史。
- 会话间传话用本 Skill 自带的 REQUEST/DISCUSSION/HANDOFF_LOG 文件约定(见 references/信箱.md),
  不依赖任何外部 Skill。
