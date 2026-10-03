---
name: os
description: >
  project-os:让 Agent 记住项目、多个会话协作不打架的统一入口(中文动词)。项目记忆和协作状态都写在
  项目的 .agent-memory/ 里。This skill should be used when the user types "/os" followed by a Chinese
  verb, or says any of:"帮我记录一下这个项目"、"初始化项目记忆"、"接入"、"上次做到哪了"、"帮我了解一下这个项目"、
  "我要继续开发"、"项目现在什么状态"、"归位"、"启动"、"今天结束了记一下"、"收工"、"保存上下文"、"整理记忆"、
  "接管"、"收割"、"信箱"、"开方向"、"广播"、"清洗记忆"、"开纪元"、"体检"、"帮助"、"remember this project"、
  "where did we leave off"。Also use it proactively at the start of work in any project that has
  .agent-memory/PROJECT-STATE.md or .agent-memory/INDEX.yaml, before a session ends after meaningful work,
  and when taking over as main session after an account or tool switch.
---

# /os — 项目记忆 + 多会话协作(命令路由)

统一规则:**按动词查下表,Read 对应 references 文件,严格照步骤执行,不自由发挥。** 一次只读一个 references 文件。
所有产物写入项目 SSOT(`.agent-memory/`,位置以「定位 SSOT」结果为准)。每个文件存什么、为什么,见 references/文件说明.md。

## 动词路由表

**记忆(每个项目都用)**

| 用户说 | 读这个文件 | 一句话职责 |
|---|---|---|
| 接入 / 帮我记录一下这个项目 | references/接入.md | 建 .agent-memory(记忆 + 协作骨架)、入口指路;问最多 7 个问题填首版 |
| 启动 / 上次做到哪了 / 归位 | references/启动.md | 读 STATE+偏好+关键决定和坑(+锁、广播)→ 归位报告 → 停下等需求 |
| 收工 / 今天结束了记一下 | references/收工.md | 写会话日志,更新 STATE,追加决定、坑、偏好 |
| 整理 / 整理记忆 | references/整理.md | 跑 tidy:先列计划,用户确认后归档旧会话、升级反复出现的坑 |

**协作(同时开多个会话、多个 Agent 时)**

| 用户说 | 读这个文件 | 一句话职责 |
|---|---|---|
| 接管 | references/接管.md | 接任主 agent:核对半成品 → 接管报告 → 登记+广播 |
| 收割 | references/收割.md | 主 agent:吃 commit 信+汇总各 charter → 更新 STATE → 验收产出 |
| 信箱 | references/信箱.md | 读本会话身份的信箱,按 REQUEST/DISCUSSION/HANDOFF_LOG 约定应答 |
| 开方向 <名> | references/开方向.md | 自动建 worktree + 从模板生成 charter,登记进 STATE |
| 广播 | references/广播.md | 追加一条到 mailbox/BROADCAST.md |
| 清洗 | references/清洗.md | 把宿主记忆里的项目条目收进 .agent-memory(原文件不删) |
| 纪元 <名> | references/纪元.md | 封存旧状态到 epochs/,STATE 重写新纪元首版 |
| 矩阵 [产品名] | references/矩阵.md | 读取用户指定的本地产品注册表(可选) |
| 联动 <产品> <事> | references/联动.md | 跨项目协作:往对方项目 mailbox 写 REQUEST |
| 体检 | references/体检.md | 跑 os-doctor:锚定、分叉副本、入口、锁、记忆文件 |
| 帮助 | (不读文件) | 把上面两张表原样打给用户 |

## 自然语言兜底(用户不必记动词)

`/os` 后面跟的若不是上表动词而是自然语言描述(如"帮我汇总一下各方向进展"),
**按语义匹配上表最接近的一个动词**,然后照常走该动词的 references;
匹配置信不足时,把路由表打给用户让其选择,**绝不自由发挥**。

## 定位 SSOT(所有动词的第 0 步,锚定优先)

1. `git rev-parse --path-format=absolute --git-common-dir` → 读该目录下 `project-os.json` 的 `ssotDir`(多 worktree 唯一锚定),其中存在 `PROJECT-STATE.md` → 就是它。
2. 无锚定文件 → 当前目录 `.agent-memory/PROJECT-STATE.md`(单 worktree 小项目兜底)。
3. 只有旧版 `.agent-memory/INDEX.yaml` → 可读(见启动.md),并提示可用「接入」升级。
4. 都没有 → 告诉用户"本项目还没有项目记忆,要跑 /os 接入 吗",停。
5. ⚠️ 锚定命中后,若 cwd 下**另有**一份 `.agent-memory/PROJECT-STATE.md`(≠锚定路径)→ 那是历史分叉副本:不读它,并在报告里提醒用户清理(体检会抓)。

## 平台边界

本 Skill 只依赖 Node.js、Git(使用 Git 项目时)和 Markdown 文件。`scripts/` 下的 `init.cjs`、`tidy.cjs`、
`os-doctor.cjs`、`precompact-snapshot.cjs` 是可选的本地辅助脚本，不会自动修改全局配置；它们不要求
Claude Code、Codex、特定 IDE 或云服务。若目标环境没有某个平台的 hook、入口文件或 MCP，跳过
对应检查并报告“未配置”，不要伪造通过。

## 铁律(所有动词共守)

**记忆**
- 先读一页,再按需读:STATE → 偏好 → 标 `[critical]` 的决定和坑 → 按任务挑着读。不全量加载。
- 决定、坑、偏好、会话日志只追加。推翻决定 = 追加新条目 + 旧条目状态改"已推翻"(唯一允许改旧内容的地方)。
- 不知道写 `[待补充]`,不留空白,不编造。记忆只代表写下那一刻:用之前核对,和代码矛盾以代码为准。
- git 能查到的不记;记 git 记不住的:用户拍板了什么、为什么。只对本项目有效的偏好写 PREFERENCES.md,跨项目的交给宿主记忆。
- 整理(归档、升级)只在用户说"整理"时做,先给计划再动手;不删除任何记忆文件。

**协作**
- 每个会话都是**项目负责人**,但**写权跟着 worktree 走**(并发产权):一个 worktree 同时只有一个写会话。改主线前先看 `<SSOT>/locks/`——有人持锁就别碰主线(在自己方向 worktree 干活,交 commit 信);主线空闲则写 `locks/主线.lock.md`(谁/何时/在干什么)认领,收工删除。每次 git commit 后必须写「commit 信」到 `<SSOT>/mailbox/commits/<方向名>.md`(**shell 真追加,禁整文件重写**;内容=改动点 + 用户关键决策 + 为什么这样设计),同步给主 agent。
- **打包、发版、收割汇总、维护 PROJECT-STATE 只归主 agent**(用户明示的那个会话,或走「接管」)。只有一个会话在干活时,它就是主 agent。Edit 工具报"找不到 old_string"= 可能有并发改动:重新 Read 再改,不要硬凑。
- 省 token:只读路由表指到的那一个 references 文件;STATE 单页;报告固定格式;不复读历史。
- 会话间传话用本 Skill 自带的 REQUEST/DISCUSSION/HANDOFF_LOG 文件约定(见 references/信箱.md),不依赖任何外部 Skill。
