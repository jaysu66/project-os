# os — project-os 共享 Skill

`os` 是一个轻量的项目协作操作系统：把项目状态、并行方向、会话交接和阶段收口
写进项目仓库，让多个 Agent 或多个会话围绕同一份 SSOT 协作。它不绑定某个模型、IDE、
云服务或公司知识库。

## 它能做什么

- `/os 启动`：读取项目 SSOT，输出归位报告，确认当前分支、锁和并行方向。
- `/os 接入`：在项目中创建 `.agent-memory` 状态骨架（幂等，已有文件不覆盖）。
- `/os 开方向 <名称>`：为独立工作方向准备 charter 和隔离工作区约定。
- `/os 信箱`、`/os 广播`、`/os 联动`：用 Markdown 文件传递请求、讨论和通知。
- `/os 收割`：由主负责人汇总各方向进展、验收交付物并刷新状态。
- `/os 体检`：运行只读健康检查，查看 SSOT 锚定、分叉状态和锁。
- `/os 清洗`、`/os 纪元`、`/os 矩阵`：按需治理记忆、封存重大换代、读取项目自有注册表。

## 安装

将本目录复制到目标 Agent 的 Skill 目录，并确保目录名保持为 `os`。只使用 `SKILL.md`
也可以；`assets/`、`references/` 和 `scripts/` 是完整流程所需的配套文件。

前置条件：

- Node.js 18 或更高版本（仅运行辅助脚本时需要）；
- Git（只有使用 Git 锚定、分支和 worktree 检查时需要）；
- 一个可写的项目目录。

## 最小使用示例

在项目根目录运行：

```powershell
node path/to/os/scripts/init.cjs
node path/to/os/scripts/os-doctor.cjs
```

然后让 Agent 读取本 Skill 并执行 `/os 启动`。初始化脚本只会创建缺失的 `.agent-memory`
文件和目录，不会覆盖已有项目状态。

## 文件说明

- `SKILL.md`：命令路由和不可违反的协作边界。
- `references/`：每个命令的详细流程，按需读取，不要求一次加载全部内容。
- `assets/`：PROJECT-STATE、charter 和多会话协议模板。
- `scripts/init.cjs`：幂等初始化 SSOT 骨架。
- `scripts/os-doctor.cjs`：只读健康检查，不修复、不删除。
- `scripts/precompact-snapshot.cjs`：可选的压缩前 Git 状态快照脚本。

## 副作用与安全边界

- `init.cjs` 会在当前项目创建 `.agent-memory/`；运行前确认当前目录正确。
- `os-doctor.cjs` 只读 Git 和文件状态，退出码始终为 0；警告需要人工判断。
- `precompact-snapshot.cjs` 会在 SSOT 写入快照，其中可能包含本机工作目录和 Git 状态，
  不应把含私人路径的快照提交到公共仓库。
- 本 Skill 不读取或上传凭据，不访问预设的公司知识库，也不会自动修改全局 Agent 配置。
- 高影响写入、删除、发布、发版和状态裁决仍需项目负责人授权。

## 卸载

从 Agent 的 Skill 目录删除本 `os` 文件夹即可。它不会自动删除目标项目已经生成的
`.agent-memory`、charter、信箱或快照；如需清理这些项目数据，请在确认范围后单独处理。

## 适配范围

核心协议是 Markdown + Git + Node.js，可被不同 Agent 宿主实现。入口文件名（如
`AGENTS.md`、`CLAUDE.md`）、生命周期 hook、全局记忆桶和 MCP 均为可选适配项；缺失时应
报告“未配置”，不能假设存在。`references/矩阵.md` 只读取用户明确指定或项目 SSOT 下的
注册表，不包含任何真实组织、客户或产品数据。

## 来源与许可

本 Skill 源自作者个人 project-os 实践的通用化版本。以 MIT 许可证发布，见 [LICENSE](LICENSE)。
