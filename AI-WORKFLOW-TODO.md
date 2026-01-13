# Nano Banana Video - AI 原生工作流梳理

> 基于《AI 原生开发工作流实战》22讲的项目落地清单

---

## 一、现状盘点

### ✅ 已完成（框架基础）

| 模块 | 文件 | 状态 |
|------|------|------|
| 长期记忆 | `CLAUDE.md` | ✅ 完整 |
| 工程宪法 | `constitution.md` | ✅ 完整（10条原则） |
| 跨 Agent 标准 | `AGENTS.md` | ✅ 完整 |
| 团队配置 | `.claude/settings.json` | ✅ 含权限/Hooks |
| 指令集 | `.claude/commands/` | ⚠️ 部分完成 |
| 专家代理 | `.claude/agents/playwright-browser.md` | ⚠️ 仅浏览器专家 |
| 自动化钩子 | `.claude/hooks/` | ✅ format/protect/i18n |

### ❌ 缺失（需要补充）

| 模块 | 缺失内容 | 优先级 |
|------|----------|--------|
| **SDD 规范目录** | `specs/` 目录结构 | 🔴 高 |
| **SDD 模板** | `.claude/templates/` | 🔴 高 |
| **Skills** | `.claude/skills/` | 🟡 中 |
| **专家 Subagents** | Next.js/i18n/Security 专家 | 🟡 中 |
| **补充指令** | `/specify` `/plan` `/tasks` `/i18n-check` | 🟡 中 |
| **.gitignore** | settings.local.json | 🟢 低 |

---

## 二、目录结构规划

### 完整的 .claude/ 结构

```
.claude/
├── settings.json           ✅ 已有 - 团队基线配置
├── settings.local.json     ⚠️  需加入 .gitignore
│
├── commands/               ⚠️  部分完成
│   ├── review.md           ✅ 已有 - 代码审查
│   ├── commit.md           ✅ 已有 - 生成提交信息
│   ├── test.md             ✅ 已有 - 运行测试
│   ├── screenshot.md       ✅ 已有 - 网页截图
│   ├── form-test.md        ✅ 已有 - 表单测试
│   ├── specify.md          ❌ 缺失 - 生成 spec.md
│   ├── plan.md             ❌ 缺失 - 生成 plan.md
│   ├── tasks.md            ❌ 缺失 - 生成 tasks.md
│   └── i18n-check.md       ❌ 缺失 - i18n 完整性检查
│
├── agents/                 ⚠️  部分完成
│   ├── playwright-browser.md  ✅ 已有 - 浏览器自动化
│   ├── nextjs-expert.md    ❌ 缺失 - Next.js/React 专家
│   ├── i18n-expert.md      ❌ 缺失 - 国际化专家
│   └── security-reviewer.md ❌ 缺失 - 安全审查专家
│
├── skills/                 ❌ 全部缺失
│   └── nextjs-best-practices/
│       └── SKILL.md
│
├── hooks/                  ✅ 已有
│   ├── auto-format.sh      ✅ 自动格式化
│   ├── protect-main-branch.py ✅ 主分支保护
│   └── check-i18n.py       ✅ i18n 检查
│
└── templates/              ❌ 全部缺失
    ├── spec-template.md    # 需求规范模板
    ├── plan-template.md    # 技术方案模板
    └── tasks-template.md   # 任务列表模板

specs/                      ❌ 全部缺失
└── 001-feature-example/    # 首个功能示例
    ├── spec.md
    ├── plan.md
    └── tasks.md
```

---

## 三、待办清单

### Phase 1: SDD 基础设施（必须）

#### 1.1 创建 SDD 模板

**文件**: `.claude/templates/spec-template.md`

```markdown
# [Feature Name] - 需求规范

## 元信息
- **创建日期**: {{DATE}}
- **负责人**: {{AUTHOR}}
- **优先级**: P0 / P1 / P2

---

## 用户故事

**作为一名** [角色]
**我想要** [功能]
**以便于** [价值]

---

## 功能性需求

### 核心功能
1. 需求描述...
2. 需求描述...

### 边界条件
- 必须支持...
- 不能包含...

---

## 非功能性需求

### 性能要求
- 响应时间 < X ms
- 并发支持 > Y 用户

### 安全要求
- [ ] 输入验证
- [ ] 权限检查

---

## 验收标准

- [ ] 场景 1: 描述
- [ ] 场景 2: 描述
- [ ] 场景 3: 描述

---

## 约束条件

- 技术约束
- 时间约束
- 资源约束
```

**文件**: `.claude/templates/plan-template.md`

```markdown
# [Feature Name] - 技术方案

## 元信息
- **基于**: spec.md v1.0
- **状态**: 草稿 / 待审查 / 已批准

---

## 技术选型

- **框架**: Next.js 16 (App Router)
- **状态**: Server Components + Zustand
- **数据库**: Drizzle ORM
- **国际化**: next-intl

---

## 合宪性审查

- [ ] 第一条：简单性原则（YAGNI、标准库优先）
- [ ] 第二条：现代 React/Next.js 开发（Server Components 优先）
- [ ] 第三条：国际化规范（所有文本使用翻译）
- [ ] 第四条：UI/UX 规范（Radix UI + Tailwind）
- [ ] 第五条：数据与状态管理（Server Actions）
- [ ] 第六条：测试与质量
- [ ] 第七条：安全原则
- [ ] 第八条：Git 工作流
- [ ] 第九条：浏览器操作
- [ ] 第十条：AI 协作原则

---

## 项目结构

```
app/[locale]/(basic-layout)/[feature]/
├── page.tsx              # 页面入口
└── components/           # 功能组件

components/[feature]/
├── [feature]-card.tsx
└── [feature]-form.tsx

lib/
└── [feature].ts          # 业务逻辑
```

---

## 核心数据结构

```typescript
interface [Entity] {
  id: string;
  // ...
}
```

---

## 接口设计

### Server Actions
```typescript
'use server';
export async function create[Entity](data: [Entity]Input) {
  // ...
}
```

---

## 依赖关系

- 依赖哪些现有模块
- 被哪些模块依赖

---

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| ... | ... | ... |
```

**文件**: `.claude/templates/tasks-template.md`

```markdown
# [Feature Name] - 任务列表

## 元信息
- **基于**: plan.md v1.0
- **预计工时**: X 天

---

## Phase 1: Foundation（数据结构）
- [ ] T001: 创建 types 文件
- [ ] T002: 创建 schema 定义
- [ ] T003: 生成并执行迁移

---

## Phase 2: Server Actions（后端逻辑）
- [ ] T101 [P]: 编写 action 测试（TDD）
- [ ] T102: 实现 action
- [ ] T103 [P]: 编写另一个 action 测试
- [ ] T104: 实现另一个 action

---

## Phase 3: Components（前端组件）
- [ ] T201: 创建组件结构
- [ ] T202: 实现表单组件（含 i18n）
- [ ] T203: 实现列表组件
- [ ] T204: 集成状态管理

---

## Phase 4: Pages（页面集成）
- [ ] T301: 创建页面路由
- [ ] T302: 添加翻译文件（en/zh/ja）
- [ ] T303: 集成组件
- [ ] T304: 测试完整流程

---

## Phase 5: 验证与交付
- [ ] T401: 运行 /review 审查代码
- [ ] T402: 修复审查问题
- [ ] T403: 执行 /commit 提交代码
- [ ] T404: 创建 PR

---

图例: [P] = 可并行执行
```

#### 1.2 创建 Slash Commands

**文件**: `.claude/commands/specify.md`

```yaml
---
description: 通过对话澄清需求，生成 spec.md 规范文件
argument-hint: <feature-name>
model: opus
allowed-tools:
  - Read
  - Write
  - Bash
---

# 需求澄清指令

你是一位资深产品经理和需求分析师。

## 任务目标

通过与用户的对话澄清需求，最终生成一份高质量的 `spec.md` 文件。

## 执行步骤

1. **理解上下文**
   - 阅读 `@constitution.md` 了解项目原则
   - 阅读 `@CLAUDE.md` 了解项目结构
   - 阅读 `@AGENTS.md` 了解技术规范

2. **需求澄清**
   向用户提出以下关键问题：
   - 这个功能的用户是谁？
   - 解决什么问题？
   - 核心功能是什么？
   - 有哪些边界条件？
   - 验收标准是什么？

3. **生成规范**
   - 在 `specs/` 目录下创建功能目录
   - 使用 `.claude/templates/spec-template.md` 作为模板
   - 生成 `spec.md` 文件

4. **确认输出**
   展示生成的 spec.md 内容，等待用户确认。

请开始向用户提问。
```

**文件**: `.claude/commands/i18n-check.md`

```yaml
---
description: 检查代码中的 i18n 问题（硬编码文本、缺失翻译）
argument-hint: <file_or_directory>
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
---

# i18n 完整性检查指令

## 检查项

1. **硬编码文本检测**
   - 搜索 JSX/TSX 中的硬体中文、英文、日文字符串
   - 排除注释、console.log、debugger

2. **翻译 Key 完整性**
   - 检查 en/zh/ja 三个语言目录的 key 是否一致
   - 报告缺失的翻译

3. **输出报告**

## 输出格式

### 总体状况
- 检查文件数: X
- 发现问题数: Y

### 硬编码文本
#### 🔴 必须修复
- `文件路径:行号`: "硬编码内容"
- ...

### 缺失翻译
#### 🟡 建议补充
- `Landing.hero.newTitle`: 缺少 zh/ja 翻译
- ...
```

### Phase 2: 专家 Subagents（推荐）

#### 2.1 Next.js 专家

**文件**: `.claude/agents/nextjs-expert.md`

```yaml
---
name: nextjs-expert
description: Next.js 16 + React 19 技术专家，负责架构设计、性能优化和最佳实践指导
tools:
  - Read
  - Grep
  - Glob
  - Bash(pnpm:*)
model: opus
---

# Next.js 技术专家

你是 Nano Banana Video 项目的 Next.js 技术专家。

## 核心职责

1. **架构设计**
   - App Router 结构规划
   - Server vs Client Components 决策
   - 并行路由和拦截路由设计

2. **性能优化**
   - 代码分割策略
   - 图片优化（next/image）
   - 缓存策略（revalidate）
   - Bundle 分析

3. **代码审查**
   - 对照 `@constitution.md` 第二条
   - 检查 Server Component 使用是否合理
   - 检查 'use client' 是否滥用
   - 性能最佳实践审查

## 回答问题时

1. 先阅读 `@constitution.md` 确保符合项目原则
2. 基于 Next.js 16 + React 19 最新特性给出建议
3. 提供代码示例
4. 说明为什么这样做（性能/可维护性）
```

#### 2.2 i18n 专家

**文件**: `.claude/agents/i18n-expert.md`

```yaml
---
name: i18n-expert
description: 国际化专家，负责 next-intl 翻译管理和多语言最佳实践
tools:
  - Read
  - Grep
  - Glob
model: sonnet
---

# i18n 国际化专家

你是 Nano Banana Video 项目的国际化专家。

## 核心职责

1. **翻译管理**
   - 检查 i18n/messages/{locale}/ 下的翻译文件
   - 确保 en/zh/ja 三个语言的 key 一致
   - 发现缺失的翻译

2. **代码审查**
   - 对照 `@constitution.md` 第三条
   - 检测硬编码文本
   - 检查翻译 key 命名规范
   - 确保 useTranslations/getTranslations 正确使用

3. **翻译建议**
   - 新增功能的翻译组织
   - 命名空间规划

## 回答问题时

1. 先检查所有三个语言的翻译文件
2. 报告不一致的地方
3. 提供修复方案
```

### Phase 3: Skills（可选）

**文件**: `.claude/skills/server-components/SKILL.md`

```yaml
---
name: server-components
description: React Server Components 最佳实践和模式
---

# React Server Components

这是一个关于 React Server Components 最佳实践的技能胶囊。

## 核心原则

1. **默认 Server Component**
   - 不需要交互的组件，不要加 'use client'
   - 数据获取在 Server Component 完成

2. **Client Component 最小化**
   - 只在真正需要交互时使用
   - 保持组件边界清晰

3. **数据下沉，交互上浮**
   - 数据在 Server Component 获取
   - 交互在 Client Component 处理

## 常见模式

### Server Component 获取数据
```typescript
// ✅ 正确
export default function VideoList() {
  const videos = await db.query.videos.findMany();
  return <div>{videos.map(...)}</div>;
}
```

### Client Component 处理交互
```typescript
'use client';
export function VideoPlayer({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false);
  return <button onClick={() => setPlaying(true)}>Play</button>;
}
```

### 组合模式
```typescript
// Server Component
export default function VideoPage() {
  const video = await getVideo(params.id);
  return (
    <div>
      <h1>{video.title}</h1>
      <VideoPlayer videoId={video.id} />  // Client Component
    </div>
  );
}
```
```

---

## 四、使用流程

### 新功能开发标准流程

```
1. 需求澄清
   /specify new-feature
   ↓
2. 技术方案
   /plan specs/new-feature/spec.md
   ↓
3. 任务分解
   /tasks specs/new-feature/plan.md
   ↓
4. 开发实现
   按 tasks.md 顺序执行（TDD）
   ↓
5. 代码审查
   /review components/new-feature/
   ↓
6. 提交代码
   /commit
```

### 快捷指令

| 指令 | 作用 |
|------|------|
| `/specify <name>` | 澄清需求并生成 spec.md |
| `/plan <spec-file>` | 基于 spec 生成 plan.md |
| `/tasks <plan-file>` | 基于 plan 生成 tasks.md |
| `/review <path>` | 代码审查 |
| `/commit` | 生成提交信息 |
| `/i18n-check <path>` | i18n 完整性检查 |

---

## 五、行动建议

### 立即执行（今天）

1. **创建 `.claude/templates/` 目录**
   - spec-template.md
   - plan-template.md
   - tasks-template.md

2. **补充 Slash Commands**
   - specify.md
   - plan.md
   - tasks.md
   - i18n-check.md

3. **创建首个功能 spec 示例**
   - 在 `specs/001-example/` 下创建一个示例
   - 展示 SDD 流程如何工作

### 本周完成

1. **创建专家 Subagents**
   - nextjs-expert.md
   - i18n-expert.md
   - security-reviewer.md

2. **创建第一个 Skill**
   - server-components 或 next-intl-best-practices

3. **更新 .gitignore**
   - 添加 `.claude/settings.local.json`

### 持续迭代

1. **沉淀经验**
   - 将重复出现的问题固化到 commands/skills
   - 将审查发现的问题补充到 constitution

2. **优化工作流**
   - 记录哪些指令最常用
   - 优化 prompt 获得更稳定输出

---

*生成时间: 2025-01-13*
*基于: AI-NATIVE-WORKFLOW.md*
