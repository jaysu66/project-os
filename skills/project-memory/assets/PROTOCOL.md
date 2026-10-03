# PROTOCOL — 记忆读写规矩(project-memory)

> 用户可以改这页;Agent 不改。

## 开工(按顺序)
1. 读 PROJECT-STATE.md
2. 读 PREFERENCES.md(有就读)
3. 读 DECISIONS.md、GOTCHAS.md 索引里标 `[critical]` 的行
4. 按任务挑着读:改结构看相关决定,写代码看相关坑,接着干看最新 1~2 份 SESSIONS
5. 记忆里提到的文件、命令,用之前先确认还在;和代码矛盾时以代码为准

## 收工(有实质工作就做)
1. 写 SESSIONS/YYYY-MM-DD.md(同日追加"## 会话 2")
2. 更新 PROJECT-STATE.md:状态、正在做、待办、最近会话、更新日期
3. 新决定 → DECISIONS.md;新坑 → GOTCHAS.md(同一个坑只加次数)
4. 用户的纠正和偏好 → PREFERENCES.md(带日期和出处)

## 写法
- 决定、坑、偏好、会话日志只追加;推翻决定 = 新增一条 + 旧条目标"已推翻"
- 不知道写 `[待补充]`,不编造
- git 能查到的不记;记用户拍板了什么、为什么

## 整理(用户说"整理记忆"才做)
- 30 天前的会话 → ARCHIVE/YYYY-QN.md 一行摘要,原文件保留
- 同一个坑出现 3 次 → 提炼成 CONTEXT.md 的硬约束
- STATE 超过 7 天没更新 → 刷新

## 谁能改什么
- 任何 Agent 都可以追加;改已有决定或本规矩要先告诉用户
- 不删除任何记忆文件
