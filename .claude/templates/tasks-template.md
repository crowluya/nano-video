# [Feature Name] - 任务列表

> 基于 plan.md 的可执行任务分解

---

## 元信息

| 字段 | 值 |
|------|-----|
| **基于方案** | plan.md v{{VERSION}} |
| **预计工时** | X 天 |
| **执行状态** | 进行中 |

---

## 任务说明

- [P] 标记表示可并行执行
- 任务按依赖关系排序
- 遵循 TDD：先写测试，再写实现

---

## Phase 1: Foundation（数据层）

### T001: 创建类型定义
- [ ] 创建 `lib/[feature]/types.ts`
- [ ] 定义 `[Entity]` 接口
- [ ] 定义 `[Entity]Input` / `[Entity]Update`
- [ ] 验证类型正确性

**依赖**: 无
**预计**: 10分钟

---

### T002: 创建 Zod 验证
- [ ] 创建 `lib/[feature]/validations.ts`
- [ ] 定义 `[entity]InputSchema`
- [ ] 定义 `[entity]UpdateSchema`
- [ ] 添加错误消息（支持 i18n）

**依赖**: T001
**预计**: 10分钟

---

### T003: 创建数据库 Schema
- [ ] 在 `lib/db/schema.ts` 中定义表
- [ ] 添加索引
- [ ] 添加关系定义
- [ ] 生成迁移: `pnpm db:generate`
- [ ] 执行迁移: `pnpm db:migrate`

**依赖**: T001
**预计**: 15分钟

---

## Phase 2: Server Actions（业务逻辑）

### T101 [P]: 编写创建 Action 测试
- [ ] 创建测试文件 `actions/[feature].test.ts`
- [ ] Mock auth session
- [ ] Mock database
- [ ] 测试成功场景
- [ ] 测试验证失败
- [ ] 测试未授权场景

**依赖**: T002, T003
**预计**: 15分钟

---

### T102: 实现创建 Action
- [ ] 创建 `actions/[feature].ts`
- [ ] 实现 `create[Entity]`
- [ ] 添加输入验证
- [ ] 添加权限检查
- [ ] 添加错误处理
- [ ] 通过测试

**依赖**: T101
**预计**: 15分钟

---

### T103 [P]: 编写查询 Action 测试
- [ ] 测试查询成功
- [ ] 测试不存在场景
- [ ] 测试权限检查

**依赖**: T003
**预计**: 10分钟

---

### T104: 实现查询 Actions
- [ ] 实现 `get[Entity]`
- [ ] 实现 `list[Entities]`
- [ ] 添加分页支持
- [ ] 通过测试

**依赖**: T103
**预计**: 15分钟

---

### T105: 实现更新/删除 Actions
- [ ] 实现 `update[Entity]`
- [ ] 实现 `delete[Entity]`
- [ ] 添加权限检查
- [ ] 添加测试

**依赖**: T102
**预计**: 15分钟

---

## Phase 3: Components（前端组件）

### T201 [P]: 创建卡片组件
- [ ] 创建 `components/[feature]/[feature]-card.tsx`
- [ ] Server Component（无交互）
- [ ] 添加 i18n 翻译
- [ ] 添加样式（Tailwind）
- [ ] 添加 a11y 属性

**依赖**: T104
**预计**: 20分钟

---

### T202 [P]: 创建列表组件
- [ ] 创建 `components/[feature]/[feature]-list.tsx`
- [ ] Server Component
- [ ] 集成卡片组件
- [ ] 添加空状态
- [ ] 添加加载状态

**依赖**: T201
**预计**: 15分钟

---

### T203: 创建表单组件
- [ ] 创建 `components/[feature]/[feature]-form.tsx`
- [ ] Client Component（需要交互）
- [ ] 集成 Server Actions
- [ ] 添加表单验证
- [ ] 添加错误提示
- [ ] 添加成功反馈

**依赖**: T102
**预计**: 30分钟

---

### T204: 创建弹窗组件
- [ ] 创建 `components/[feature]/[feature]-dialog.tsx`
- [ ] 使用 shadcn/ui Dialog
- [ ] 集成表单组件
- [ ] 添加动画效果

**依赖**: T203
**预计**: 15分钟

---

## Phase 4: Pages（页面集成）

### T301: 创建/更新路由页面
- [ ] 创建 `app/[locale]/(protected)/dashboard/[feature]/page.tsx`
- [ ] Server Component
- [ ] 获取数据
- [ ] 集成列表组件
- [ ] 添加页面标题和元数据

**依赖**: T202
**预计**: 15分钟

---

### T302: 添加翻译文件
- [ ] 创建 `i18n/messages/en/[feature].json`
- [ ] 创建 `i18n/messages/zh/[feature].json`
- [ ] 创建 `i18n/messages/ja/[feature].json`
- [ ] 确保所有 key 在三语言中一致

**依赖**: 无（可并行）
**预计**: 20分钟

---

### T303: 创建加载和错误状态
- [ ] 创建 `loading.tsx`
- [ ] 创建 `error.tsx`
- [ ] 测试错误场景

**依赖**: T301
**预计**: 10分钟

---

### T304: 集成导航菜单
- [ ] 更新 `components/dashboard/sidebar.tsx`
- [ ] 添加新菜单项
- [ ] 添加图标
- [ ] 添加翻译 key

**依赖**: T302
**预计**: 10分钟

---

## Phase 5: Testing & QA（测试验证）

### T401: E2E 测试（使用 Playwright MCP）
- [ ] 创建 `tests/e2e/features/[feature].spec.md`
- [ ] 测试列表显示
- [ ] 测试创建流程
- [ ] 测试编辑流程
- [ ] 测试删除流程
- [ ] 测试权限控制

**依赖**: T304
**预计**: 30分钟

---

### T402: 代码审查
- [ ] 运行 `/review components/[feature]/`
- [ ] 运行 `/review actions/[feature]/`
- [ ] 修复高优先级问题
- [ ] 修复中优先级问题

**依赖**: T401
**预计**: 20分钟

---

### T403: i18n 检查
- [ ] 运行 `/i18n-check components/[feature]/`
- [ ] 修复硬编码文本
- [ ] 补充缺失翻译

**依赖**: T402
**预计**: 10分钟

---

### T404: 本地验证
- [ ] 运行 `pnpm lint` - 无错误
- [ ] 运行 `pnpm build` - 构建成功
- [ ] 手动测试完整流程
- [ ] 测试三语言切换

**依赖**: T403
**预计**: 15分钟

---

## Phase 6: Documentation & Delivery（文档交付）

### T501: 更新文档
- [ ] 更新 `CLAUDE.md`（如有新约定）
- [ ] 更新 `AGENTS.md`（如有新规范）
- [ ] 添加功能说明注释

**依赖**: T404
**预计**: 10分钟

---

### T502: 生成提交信息
- [ ] 运行 `/commit`
- [ ] 审查生成的提交信息
- [ ] 执行提交

**依赖**: T501
**预计**: 5分钟

---

### T503: 创建 PR
- [ ] 推送到分支
- [ ] 创建 Pull Request
- [ ] 填写 PR 描述
- [ ] 关联 Issue（如有）

**依赖**: T502
**预计**: 10分钟

---

## 任务统计

| Phase | 任务数 | 总预计 | 完成状态 |
|-------|--------|--------|----------|
| Phase 1: Foundation | 3 | 35min | 0/3 |
| Phase 2: Server Actions | 5 | 70min | 0/5 |
| Phase 3: Components | 4 | 80min | 0/4 |
| Phase 4: Pages | 4 | 55min | 0/4 |
| Phase 5: Testing | 4 | 75min | 0/4 |
| Phase 6: Delivery | 3 | 25min | 0/3 |
| **总计** | **23** | **~5.5h** | **0/23** |

---

## 进度跟踪

```text
Foundation  ████████░░░░░░░░░░░░░  0% (0/3)

Server Actions ████████████░░░░░░░░  0% (0/5)

Components  ████████████░░░░░░░░░░  0% (0/4)

Pages       ████████████████░░░░░░  0% (0/4)

Testing     ████████████████░░░░░░  0% (0/4)

Delivery    ████████████████░░░░░░  0% (0/3)
```

---

*任务开始时间: {{START_DATE}}*
*预计完成时间: {{END_DATE}}*
