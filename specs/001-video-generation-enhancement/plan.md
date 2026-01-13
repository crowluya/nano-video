# 视频生成功能增强 - 技术方案

> 基于 spec.md 的技术实现方案

---

## 元信息

| 字段 | 值 |
|------|-----|
| **基于规范** | spec.md v1.0 |
| **状态** | 示例 |
| **技术负责人** | AI Assistant |

---

## 技术选型

| 类别 | 技术选择 | 说明 |
|------|----------|------|
| **框架** | Next.js 16 (App Router) | 项目标准 |
| **状态管理** | Server Components + Zustand | 进度状态用 Zustand |
| **数据库** | Drizzle ORM + PostgreSQL | 存储生成记录 |
| **国际化** | next-intl | en/zh/ja |
| **UI 组件** | shadcn/ui + Tailwind CSS | 项目标准 |
| **视频生成** | kie.ai API | Sora 2, Veo 3.1 |
| **存储** | Cloudflare R2 | 永久存储 |

---

## 合宪性审查

> 对照 @constitution.md 逐条检查

| 原则 | 检查项 | 状态 | 备注 |
|------|--------|------|------|
| **第一条：简单性原则** | YAGNI / 标准库优先 | ✅ | 复用现有 kie client |
| **第二条：现代 React/Next.js** | Server Components 优先 | ✅ | 列表页用 SC，表单用 CC |
| **第三条：国际化** | 无硬编码文本 | ✅ | 所有文本用 i18n |
| **第四条：UI/UX** | Radix UI + Tailwind | ✅ | 使用 shadcn/ui |
| **第五条：数据管理** | Drizzle + Server Actions | ✅ | |
| **第六条：测试质量** | 测试覆盖 | ⬜ | 需添加测试 |
| **第七条：安全** | 环境变量 + 输入验证 | ✅ | Zod 验证 |
| **第八条：Git 规范** | Conventional Commits | ✅ | |
| **第九条：浏览器操作** | Playwright MCP | ✅ | E2E 测试 |
| **第十条：AI 协作** | SDD + TDD | ✅ | 本文档即 SDD |

---

## 项目结构

```
app/[locale]/(protected)/dashboard/video/
├── page.tsx                    # 视频生成主页 (Server Component)
├── loading.tsx                 # 加载状态
├── error.tsx                   # 错误边界
└── history/
    └── page.tsx                # 历史记录页

components/video-generation/
├── video-generator.tsx         # 生成表单 (Client Component)
├── video-progress.tsx          # 进度显示 (Client Component)
├── video-preview.tsx           # 视频预览 (Client Component)
├── video-history-list.tsx      # 历史列表 (Server Component)
├── video-history-card.tsx      # 历史卡片 (Server Component)
├── model-selector.tsx          # 模型选择器 (Client Component)
└── image-uploader.tsx          # 图片上传 (Client Component)

lib/video-generation/
├── types.ts                    # 类型定义
├── validations.ts              # Zod schemas
└── constants.ts                # 常量（模型配置、积分消耗）

actions/
└── video-generation.ts         # Server Actions

stores/
└── video-generation-store.ts   # Zustand 状态（进度追踪）

i18n/messages/
├── en/VideoGeneration.json
├── zh/VideoGeneration.json
└── ja/VideoGeneration.json
```

---

## 核心数据结构

### 数据库 Schema

```typescript
// lib/db/schema/video-generations.ts
import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const videoGenerations = pgTable('video_generations', {
  id: serial('id.primaryKey(),
  userId: text('user_id').notNull(),

  // 任务信息
  taskId: text('task_id').notNull().unique(),
  model: text('model').notNull(), // 'sora2' | 'veo3'
  mode: text('mode').notNull(), // 'text-to-video' | 'image-to-video'

  // 输入
  prompt: text('prompt').notNull(),
  inputImageUrl: text('input_image_url'),

  // 参数
  duration: integer('duration').notNull(), // 秒
  resolution: text('resolution').notNull(), // '720p' | '1080p'

  // 输出
  status: text('status').notNull().default('pending'), // pending | processing | completed | failed
  outputUrl: text('output_url'),
  r2Url: text('r2_u存储 URL
  thumbnailUrl: text('thumbnail_url'),

  // 积分
  creditsUsed: integer('credits_used').notNull(),

  // 元数据
  metadata: jsonb('metadata'),
  errorMessage: text('error_message'),

  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});
```

### TypeScript 类型

```typescript
// lib/video-generation/types.ts
export type VideoModel = 'sora2' | 'veo3';
export type VideoMode = 'text-to-video' | 'image-to-video';
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type VideoResolution = '720p' | '1080p';

export interface VideoGenerationInput {
  model: VideoModel;
  mode: VideoMode;
  prompt: string;
  inputImageUrl?: string;
  duration: number;
  resolution: VideoResolution;
}

export interface VideoGeneration {
  id: number;
  userId: string;
  taskId: string;
  model: VideoModel;
  mode: VideoMode;
  prompt: string;
  inputImageUrl?: string;
  duration: number;
  resolution: VideoResolution;
  status: VideoStatus;
  outputUrl?: string;
  r2Url?: string;
  thumbnailUrl?: string;
  creditsUsed: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface VideoProgress {
  taskId: string;
  statuStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // 秒
}
```

### Zod 验证

```typescript
// lib/video-generation/validations.ts
import { z } from 'zod';

export const videoGenerationInputSchema = z.object({
  model: z.enum(['sora2', 'veo3']),
  mode: z.enum(['text-to-video', 'image-to-video']),
  prompt: z.string().min(1).max(500),
  inputImageUrl: z.string().url().optional(),
  duration: z.number().int().min(5).max(15),
  resolution: z.enum(['720p', '1080p']),
});

export const saveToR2InputSchema = z.object({
  generationId: z.number().int().positive(),
});
```

---

## 接口设计

### Server Actions

```typescript
// actions/video-generation.ts
'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { videoGenerations } from '@/lib/db/schema';
import { videoGenerationInputSchema } from '@/lib/video-generation/validations';
import { actionResponse } from '@/lib/action-response';
import { kieClient } from '@/lib/kie/client';
import { deductCredits, checkCredits } from '@/lib/payments/credit-manager';
import { VIDEO_CREDITS } from '@/lib/video-generation/constants';

export async function createVideoGeneration(data: unknown) {
  // 1. 验证输入
  const validated = videoGenerationInputSchema.safeParse(data);
  if (!validated.success) {
    return actionResponse.badRequest('Invalid input');
  }

  // 2. 检查权限
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    return actionResponse.unauthorized();
  }

  // 3. 检查积分
  const creditsNeeded = VIDEO_CREDITS[validated.data.model];
  const hasCredits = await checkCredits(session.user.id, creditsNeeded);
  if (!hasCredits) {
    return actionResponse.badRequest('Insufficient credit  }

  // 4. 调用 kie.ai API
  try {
    const task = await kieClieneVideo(validated.data);

    // 5. 扣除积分
    await deductCredits(session.user.id, creditsNeeded, `video-${task.taskId}`);

    // 6. 保存记录
    const [record] = await db.insert(videoGenerations).values({
      userId: session.user.id,
      taskId: task.taskId,
      ...validated.data,
      creditsUsed: creditsNeeded,
      status: 'pending',
    }).returning();

    return actionResponse.success(record);
  } catch (error) {
    return actionResponse.serverError('Failed to create video generation');
  }
}

export async function getVideoProgress(taskId: string) {
  // 调用 kie.ai 获取进度
  const progress = await kieClient.getTaskStatus(taskId);
  return actionResponse.success(progress);
}

export async function saveVideoToR2(generationId: number) {
  // 1. 获取记录
  // 2. 下载视频
  // 3. 上传到 R2
  // 4. 更新记录
}

export async function getUserVideoHistory(page = 1, pageSize = 20) {
  // 分页查询用户的视频生成历史
}

export async function deleteVideoGeneration(id: number) {
  // 删除记录（软删除或硬删除）
}
```

---

## 组件设计

### Server Component (默认)

```typescript
// app/[locale]/(protected)/dashboard/video/page.tsx
import { getTranslations } from 'next-intl/server';
import { VideoGenerator } from '@/components/video-generation/video-generator';

export default async function VideoGenerationPage() {
  const t = await getTranslations('VideoGeneration');

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-muted-foreground mb-8">{t('description')}</p>

      <VideoGenerator />
    </div>
  );
}
```

### Client Component (需要交互时)

```typescript
// components/video-generation/video-getsx
'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { createVideoGeneration } from '@/actions/video-generation';
import { useVideoGenerationStore } from '@/stores/video-generation-store';
import { ModelSelector } from './model-selector';
import { ImageUploader } from './image-uploader';
import { VideoProgress } from './video-progress';
import { VideoPreview } from './video-preview';

export function VideoGenerator() {
  const t = useTranslations('VideoGeneration.form');
  const [isPending, startTransition] = useTransition();
  const { currentTask, setCurrentTask } = useVideoGenerationStore();

  // ... 实现
}
```

---

## 状态管理

### Zustand Store

```typescript
// stores/video-generation-store.ts
import { create } from 'zustand';
import type { VideoProgress } from '@/lib/video-generation/types';

interface VideoGenerationState {
  currentTask: VideoProgress | null;
  setCurrentTask: (task: VideoProgress | null) => void;
  updateProgress: (progress: Partial<VideoProgress>) => void;
}

export const useVideoGenerationStore = create<VideoGenerationState>((set) => ({
  currentTask: null,
  setCurrentTask: (task) => set({ currentTask: task }),
  updateProgress: (progress) =>
    set((state) => ({
      currentTask: state.currentTask
        ? { ...state.currentTask, ...progress }
        : null,
    })),
}));
```

---

## 翻译文件结构

```json
// i18n/messages/en/VideoGeneration.json
{
  "title": "AI Video Generation",
  "description": "Create stunning videos with AI",
  "form": {
    "promptLabel": "Describe your video",
    "promptPlaceholder": "A cat playing piano in a jazz club...",
    "modelLabel": "Select Model",
    "durationLabel": "Duration",
    "resolutionLabel": "Resolution",
    "uploadImage": "Upload First Frame",
    "submit": "Generate Video",
    "generating": "Generating..."
  },
  "progress": {
    "title": "Generating Your Video",
    "estimatedTime": "Estimated time remaining: {minutes} min",
    "processing": "Processing...",
    "completed": "Completed!"
  },
  "history": {
    "title": "Your Videos",
    "empty": "No videos yet. Create your first one!",
    "saveToCloud": "Save to Cloud",
    "delete": "Delete",
    "download": "Download"
  },
  "errors": {
    "insufficientCredits": "Insufficient credits. Please top up.",
    "generationFailed": "Video generation failed. Please try again.",
    "invalidPrompt": "Please enter a valid prompt."
  },
  "models": {
    "sora2": "Sora 2",
    "sora2Description": "Best for realistic videos",
    "veo3": "Veo 3.1",
    "veo3Description": "Best for creative content"
  }
}
```

---

## 依赖关系

### 依赖的模块
- `lib/kie/client.ts` - kie.ai API 客户端
- `lib/cloudflare/r2.ts` - R2 存储
- `lib/payments/credit-manager.ts` - 积分管理
- `lib/auth` - 认证
- `components/ui` - 基础 UI 组件

### 被依赖的模块
- `dashboard/studio` - 一体化工作流页面

---

## 测试策略

| 测试类型覆盖目标 |
|----------|------|----------|
| 单元测试 | Vitest | Server Actions 80%+ |
| 集成测试 | Playwright MCP | API 流程 |
| E2E 测试 | Playwright MCP | 完整生成流程 |

---

## 部署计划

1. **数据库迁移**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

2. **环境变量**
   - `KIE_API_KEY` - 已配置

3. **构建验证**
   ```bash
   pnpm build
   ```

---

*变更历史*
| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 1.0 | 2025-01-13 | 初始版本（示例） | AI Assistant |
