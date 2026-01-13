---
description: 基于 spec.md 生成技术方案 plan.md
argument-hint: <spec-file-path>
model: opus
allowed-tools:
  - Read
  - Write
  - Glob
  - Bash
---

# 技术方案生成指令

你是一位资深架构师和技术专家。

## 任务目标

基于已有的 `spec.md` 文件，生成完整的技术方案 `plan.md`。

## 执行步骤

### 1. 读取需求规范
- 读取用户指定的 spec.md 文件
- 理解功能需求、验收标准、约束条件

### 2. 理解项目技术栈
阅读以下文件：
- `@constitution.md` - 项目原则
- `@AGENTS.md` - 技术规范
- `.cursor/rules/` - 详细开发规范

### 3. 设计技术方案

#### 3.1 技术选型
基于项目现有技术栈，确保：
- Next.js 16 (App Router)
- TypeScript
- Drizzle ORM + PostgreSQL
- next-intl (en/zh/ja)
- shadcn/ui + Tailwind CSS

#### 3.2 合宪性审查
逐条对照 `constitution.md` 检查：
- 第一条：简单性原则（YAGNI）
- 第二条：Server Components 优先
- 第三条：国际化
- 第四条：UI/UX 规范
- 第五条：数据管理
- 第六条：测试质量
- 第七条：安全
- 第八条：Git 规范
- 第九条：浏览器操作
- 第十条：AI 协作

#### 3.3 项目结构设计
规划文件和目录的放置位置

#### 3.4 数据结构设计
- 数据库 Schema
- TypeScript 类型
- Zod 验证 schema

#### 3.5 接口设计
- Server Actions
- API Routes（如需要）

#### 3.6 组件设计
- Server Components
- Client Components
- 组件交互关系

### 4. 生成 plan.md

1. 在 spec.md 同目录下创建 `plan.md`
2. 使用 `.claude/templates/plan-template.md` 作为模板
3. 填写完整的技术方案

### 5. 展示并确认

展示生成的 plan.md，重点说明：
- 技术选型理由
- 潜在风险点
- 需要特别关注的地方

## 输出格式

完成时输出：

```
✅ 技术方案已生成

文件位置: specs/XXX-[feature-name]/plan.md

技术选型:
- 框架: Next.js 16 (App Router)
- 状态: Server Components + Zustand
- 数据库: Drizzle ORM + PostgreSQL
- 国际化: next-intl

数据库表:
- [entity]Table: ...

API 接口:
- create[Entity](): ...
- get[Entity](): ...

组件结构:
- [Feature]List: Server Component
- [Feature]Form: Client Component

合宪性审查:
✓ 第一条：简单性原则
✓ 第二条：Server Components 优先
✓ 第三条：国际化
...

风险点:
- 风险 1: ...
  缓解措施: ...
```

## 开始

请提供 spec.md 的路径，我将为你生成技术方案。
