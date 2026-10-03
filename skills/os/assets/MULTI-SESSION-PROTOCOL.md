# MULTI-SESSION-PROTOCOL — 多会话/多 agent 并行开发规范 v1(2026-07-07)

> 为什么有这份文件:官方记忆按"启动 cwd"分桶(用户机器上已产生 20+ 个互不相见的桶),
> 而本项目是"一项目、多启动点、多 agent"。解法 = SSOT 进仓库,官方桶只放指针。

## 一、角色

- **主 agent(main)**:负责打包/发版/收割汇总/回归/记忆治理;维护 PROJECT-STATE.md;开方向发 charter、验收产出。全项目同时只有一个(用户明示或走「接管」)。
- **项目负责人(每个会话)**:拿到会话即是自己方向的负责人;开场读 PROJECT-STATE.md + 自己的 charter;**主线可改、可 commit**;每次 commit 后写 commit 信(见下)同步 main;结束前在 charter 进展日志追加一行。
- **codex 等异构 agent**:charter 本身就是 task package(markdown,自包含),用户手动贴给 codex;交付物按 charter 的「产出」约定落文件,main 验收。

## 一之二、commit 信(负责人 → main 的强制同步)

每次 `git commit` 后,立刻追加一条到 `<SSOT>/mailbox/commits/<方向名>.md`(文件不存在就建),格式:

```
## <日期> <commit 短 hash> <一句话标题>
- 改动点:<改了哪些文件/行为,1-3 行>
- 用户关键决策:<用户在这轮拍板了什么;没有就写"无">
- 为什么这样设计:<设计原因/取舍,1-3 行>
```

main 收割时读全部 commits/*.md 汇总进 STATE,汇总过的条目移入文件底部「已收割」小节。

## 二、charter(作战许可证)规范

每个并行方向一份 `charters/<名>.md`,必含六节:
1. **使命**(一句话)+ 背景(为什么做)
2. **边界**:本方向主要负责哪些目录/模块(防交叠撞车;主线可改,commit 后发 commit 信)
3. **必读**(按序,控制在 5 个文件内):PROJECT-STATE → charter 自己 → 专题文档
4. **已知资产**:可复用的代码/研究/skill 的确切路径
5. **产出约定**:交付物写哪、格式什么、怎么算完成(DoD)
6. **进展日志**:负责人每次结束前追加一行(日期 + 一句话 + 产出路径)

**开场白**:每个 charter 顶部有一行"开场提示词",用户开新会话时整行复制即可。

## 三、记忆分层(写哪里的判定)

| 内容 | 写哪 |
|---|---|
| 项目事实/决策/状态/交接 | `.agent-memory/`(SSOT,进 git;写法按 project-memory:STATE / CONTEXT / DECISIONS / GOTCHAS / SESSIONS) |
| 只对本项目有效的用户偏好 | `.agent-memory/PREFERENCES.md`(只追加,带日期和出处) |
| 方向进展 | 自己的 charter「进展日志」 |
| 跨项目的个人偏好/教训 | 宿主提供的全局记忆桶(若有),照旧 |
| 官方桶里的项目记忆 | 只放**指针**指向 PROJECT-STATE.md,不放正文 |

## 四、压缩防护(已固定化,不用再嘱咐)

- **可选 PreCompact hook**：若宿主支持生命周期 hook，可调用 project-memory 的 `scripts/precompact-snapshot.cjs`，
  把 git log/status/时间戳写进 SSOT；本包不会自动注册 hook。
- 会话启动导航由宿主自行配置；没有 SessionStart hook 时按 `PROJECT-STATE.md` 手动归位。
- hook 仅依赖 Node.js 和 Git，失败应 fail-soft，不阻塞宿主会话。

## 五、并行冲突规则

1. 主线人人可改、可 commit,但**动手前 `git status`**:发现别人有未提交改动且与自己交叠 → 先写信箱找 main 协调,别硬改。
2. 小步 commit(一个功能单元一个 commit),commit 后立发 commit 信——这是并行不裂脑的生命线。
3. 端口占用:项目默认端口归 main(写在 STATE);其他负责人起服务用自己 charter 预分配的端口。
4. 打包、发版永远只从 main 出。

## 六、会话生命周期

```
开新会话(在项目目录启动)
  → SessionStart hook 注入导航 → 读 PROJECT-STATE + charter
  → 干活(边界内)
  → 结束前:charter 追加进展日志一行;有决策写 DECISIONS.md;有坑写 GOTCHAS.md
压缩(自动/手动)
  → PreCompact hook 快照 → 压缩 → SessionStart(compact) 注入导航 → 读 STATE 续跑
```
