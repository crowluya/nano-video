# 视频生成功能增强 - 任务列表

> 基于 plan.md 的可执行任务分解

---

## 元信息

| 字段 | 值 |
|------|-----|
| **基于方案** | plan.md v1.0 |
| **预计工时** | ~6 小时 |
| **执行状态** | 示例 |

---

## 任务说明

- [P] 标记表示可并行执行
- 任务按依赖关系排序
- 遵循 TDD：先写测试，再写实现

---

## Phase 1: Foundation（数据层）

### T001: 创建类型定义
- [ ] 创建 `lib/video-generation/types.ts`
- [ ] 定义 `VideoModel`, `VideoMode`, `VideoStatus` 类型
- [ ] 定义 `VideoGenerationInput` 接口
- [ ] 定义 `VideoGeneration` 接口
- [ ] 定义 `VideoProgress` 接口

**依赖**: 无
**预计**: 10分钟

---

### T002: 创建常量配置
- [ ] 创建 `lib/video-generation/constants.ts`
- [ ] 定义 `VIDEO_CREDITS` 积分消耗配置
- [ ] 定义 `VIDEO_MODELS` 模型配置
- [ ] 定义 `VIDEO_DURATIONS` 时长选项
- [ ] 定义 `VIDEO_RESOLUTIONS` 分辨率选项

**依赖**: T001
**预计**: 10分钟

---

### T003: 创建 Zod 验证
- [ ] 创建 `lib/video-generation/validations.ts`
- [ ] 定义 `videoGenerationInputSchema`
- [ ] 定义 `saveToR2InputSchema`
- [ ] 添加错误消息

**依赖**: T001
**预计**: 10分钟

---

### T004: 创建数据库 Schema
- [ ] 在 `lib/db/schema.ts` 中添加 `videoGenerations` 表
- [ ] 添加索引（userId, taskId）
- [ ] 生成迁移: `pnpm db:generate`
- [ ] 执行迁移: `pnpm db:migrate`

**依赖**: T001
**预计**: 15分钟

---

## Phase 2: Server Actions（业务逻辑）

### T101 [P]: 编写 createVideoGeneration 测试
- [ ] 创建 `actions/__tests__/video-generation.test.ts`
- [ ] Mock auth session
- [ ] Mock kie client
- [ ] Mock credit manager
- [ ] 测试成功场景
- [ ] 测试积分不足场景
- [ ] 测试未授权场景

**依赖**: T003, T004
**预计**: 20分钟

---

### T102: 实现 createVideoGeneration
- [ ] 创建 `actions/video-generation.ts`
- [ ] 实现输入验证
- [ ] 实现权限检查
- [ ] 实现积分检查和扣除
- [ ] 调用 kie.ai API
- [ ] 保存数据库记录
- [ ] 通过测试

**依赖**: T101
**预计**: 25分钟

---

### T103 [P]: 编写 getVideoProgress 测试
- [ ] 测试成功获取进度
- [ ] 测试任务不存在场景

**依赖**: T004
**预计**: 10分钟

---

### T104: 实现 getVideoProgress
- [ ] 调用 kie.ai 状态 API
- [ ] 返回进度信息
- [ ] 通过测试

**依赖**: T103
**预计**: 15分钟

---

### T105: 实现 saveVideoToR2
- [ ] 获取生成记录
- [ ] 从 kie.ai 下载视频
- [ ] 上传到 R2
- [ ] 更新数据库记录
- [ ] 添加测试

**依赖**: T102
**预计**: 20分钟

---

### T106: 实现 getUserVideoHistory
- [ ] 分页查询用户记录
- [ ] 返回列表数据
- [ ] 添加测试

**依赖**: T004
**预计**: 15分钟

---

### T107: 实现 deleteVideoGeneration
- [ ] 权限检查
- [ ] 删除 R2 文件（如有）
- [ ] 删除数据库记录
- [ ] 添加测试

**依赖**: T106
**预计**: 15分钟

---

## Phase 3: Components（前端组件）

### T201: 创建 Zustand Store
- [ ] 创建 `stores/video-generation-store.ts`
- [ ] 实现 `currentTask` 状态
- [ ] 实现 `setCurrentTask` 方法
- [ ] 实现 `updateProgress` 方法

**依赖**: T001
**预计**: 10分钟

---

### T202 [P]: 创建 ModelSelector 组件
- [ ] 创建 `components/video-generation/model-selector.tsx`
- [ ] Client Component
- [ ] 显示模型列表和描述
- [ ] 显示积分消耗
- [ ] 添加 i18n

**依赖**: T002
**预计**: 20分钟

---

### T203 [P]: 创建 ImageUploader 组件
- [ ] 创建 `components/video-generation/image-uploader.tsx`
- [ ] Client Component
- [ ] 支持拖拽上传
- [ ] 图片预览
- [ ] 大小/格式验证
- [ ] 添加 i18n

**依赖**: 无
**预计**: 25分钟

---

### T204: 创建 VideoProgress 组件
- [ ] 创建 `components/video-generation/video-progress.tsx`
- [ ] Client Component
- [ ] 显示进度条
- [ ] 显示预计剩余时间
- [ ] 轮询进度更新
- [ ] 添加 i18n

**依赖**: T201, T104
**预计**: 20分钟

---

### T205: 创建 VideoPreview 组件
- [ ] 创建 `components/video-generation/video-preview.tsx`
- [ ] Client Component
- [ ] 视频播放器
- [ ] 保存/下载按钮
- [ ] 添加 i18n

**依赖**: T105
**预计**: 20分钟

---

### T206: 创建 VideoGenerator 主组件
- [ ] 创建 `components/video-generation/video-generator.tsx`
- [ ] Client Component
- [ ] 集成 ModelSelector
- [ ] 集成 ImageUploader
- [ ] 集成 VideoProgress
- [ ] 集成 VideoPreview
- [ ] 表单提交逻辑
- [ ] 添加 i18n

**依赖**: T202, T203, T204, T205
**预计**: 30分钟

---

### T207 [P]: 创建 VideoHistoryCard 组件
- [ ] 创建 `components/video-generation/video-history-card.tsx`
- [ ] Server Component
- [ ] 显示缩略图
- [ ] 显示标题/时间
- [ ] 操作按钮（预览/保存/删除）

**依赖**: T001
**预计* 15分钟

---

### T208: 创建 VideoHistoryList 组件
- [ ] 创建 `components/video-generation/video-history-list.tsx`
- [ ] Server Component
- [ ] 集成 VideoHistoryCard
- [ ] 空状态显示
- [ ] 分页支持

**依赖**: T207, T106
**预计**: 20分钟

---

## Phase 4: Pages（页面集成）

### T301: 创建视频生成主页
- [ ] 创建 `app/[locale]/(protected)/dashboard/video/page.tsx`
- [ ] Server Component
- [ ] 集成 VideoGenerator
- [ ] 添加页面标题和元数据

**依赖**: T206
**预计**: 15分钟

---

### T302: 创建历史记录页
- [ ] 创建 `app/[locale]/(protected)/dashboard/video/history/page.tsx`
- [ ] Server Component
- [ ] 集成 VideoHistoryList
- [ ] 添加页面标题

**依赖**: T208
**预计**: 15分钟

---

### T303: 添加翻译文件
- [ ] 创建 `i18n/messages/en/VideoGeneration.json`
- [ ] 创建 `i18n/messages/zh/VideoGeneration.json`
- [ ] 创建 `i18n/messages/ja/VideoGeneration.json`
- [ ] 确保所有 key 一致

**依赖**: 无（可并行）
**预计**: 25分钟

---

### T304: 创建加载和错误状态
- [ ] 创建 `loading.tsx`
- [ ] 创建 `error.tsx`

**依赖**: T301
**预计**: 10分钟

---

### T305: 集成导航菜单
- [ ] 更新 Dashboard Sidebar
- [ ] 添加视频生成菜单项
- [ ] 添加历史记录菜单项

**依赖**: T303
**预计**: 10分钟

---

## Phase 5: Testing & QA（测试验证）

### T401: E2E 测试规范
- [ ] 创建 `tests/e2e/features/video-generation.spec.md`
- [ ] 测试文生视频流程
- [ ] 测试图生视频流程
- [ ] 测试积分不足场景
- [ ] 测试保存到 R2

**依赖**: T305
*n
---

### T402: 执行 E2E 测试
- [ ] 使用 `/test-e2e video-generation` 执行测试
- [ ] 修复发现的问题

**依赖**: T401
**预计**: 20分钟

---

### T403: 代码审查
- [ ] 运行 `/review components/video-generation/`
- [ ] 运行 `/review actions/video-generation.ts`
- [ ] 修复高优先级问题

**依赖**: T402
**预计**: 20分钟

---

### T404: i18n 检查
- [ ] 运行 `/i18n-check components/video-generation/`
- [ ] 修复硬编码文本
- [ ] 补充缺失翻译

**依赖**: T403
**预计**: 10分钟

---

### T405: 本地验证
- [ ] 运行 `pnpm lint` - 无错误
- [ ] 运行 `pnpm build` - 构建成功
- [ ] 手动测试完整流程
- [ ] 测试三语言切换

**依赖**: T404
**预计**: 15分钟

---

## Phase 6: Documentation & Delivery（文档交付）

### T501: 更新文档
- [ ] 更新 `CLAUDE.md`（如有新约定）
- [ ] 添加功能说明注释

**依赖**: T405
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

**依赖**: T502
**预计**: 10分钟

---

## 任务统计

| Phase | 任务数 | 总预计 | 完成状态 |
|-------|--------|--------|----------|
| Phase 1: Foundation | 4 | 45min | 0/4 |
| Phase 2: Server Actions | 7 | 120min | 0/7 |
| Phase 3: Components | 8 | 160min | 0/8 |
| Phase 4: Pages | 5 | 75min | 0/5 |
| Phase 5: Testing | 5 | 95min | 0/5 |
| Phase 6: Delivery | 3 | 25min | 0/3 |
| **总计** | **32** | **~8.5h** | **0/32** |

---

## 并行执行机会

以下任务可以并行执行：

**Phase 2**:
- T101 + T103 (测试可并行编写)

**Phase 3**:
- T202 + T203 + T207 (独立组件可并行)

**Phase 4**:
- T303 可与其他任务并行

---

## 进度跟踪

```text
Foundation     ░░░░░░░░░░░░░░░░░░░░  0% (0/4)

Server Actions ░░░░░░░░░░░░░░░░░░░░  0% (0/7)

Components     ░░░░░░░░░░░░░░░░░░░░  0% (0/8)

Pages          ░░░░░░░░░░░░░░░░░░░░  0% (0/5)

Testing        ░░░░░░░░░░░░░░░░░░░░  0% (0/5)

Delivery       ░░░░░░░░░░░░░░░░░░░░  0% (0/3)
```

---

*任务开始时间: 待定*
*预计完成时间: 待定*
