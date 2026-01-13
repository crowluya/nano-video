# [Feature Name] - 技术方案

> 基于 spec.md 的技术实现方案

---

## 元信息

| 字段 | 值 |
|------|-----|
| **基于规范** | spec.md v{{VERSION}} |
| **状态** | 草稿 / 待审查 / 已批准 |
| **技术负责人** | {{AUTHOR}} |

---

## 技术选型

| 类别 | 技术选择 | 说明 |
|------|----------|------|
| **框架** | Next.js 16 (App Router) | 项目标准 |
| **状态管理** | Server Components + Zustand | 根据需求选择 |
| **数据库** | Drizzle ORM + PostgreSQL | 项目标准 |
| **国际化** | next-intl | en/zh/ja |
| **UI 组件** | shadcn/ui + Tailwind CSS | 项目标准 |

---

## 合宪性审查

> 对照 @constitution.md 逐条检查

| 原则 | 检查项 | 状态 | 备注 |
|------|--------|------|------|
| **第一条：简单性原则** | YAGNI / 标准库优先 | ⬜ | |
| **第二条：现代 React/Next.js** | Server Components 优先 | ⬜ | |
| **第三条：国际化** | 无硬编码文本 | ⬜ | |
| **第四条：UI/UX** | Radix UI + Tailwind | ⬜ | |
| **第五条：数据管理** | Drizzle + Server Actions | ⬜ | |
| **第六条：测试质量** | 测试覆盖 | ⬜ | |
| **第七条：安全** | 环境变量 + 输入验证 | ⬜ | |
| **第八条：Git 规范** | Conventional Commits | ⬜ | |
| **第九条：浏览器操作** | Playwright MCP | ⬜ | |
| **第十条：AI 协作** | SDD + TDD | ⬜ | |

---

## 项目结构

```
app/[locale]/(basic-layout)/[feature]/
├── page.tsx              # 页面入口 (Server Component)
└── loading.tsx           # 加载状态

app/[locale]/(protected)/dashboard/[feature]/
├── page.tsx              # 受保护页面
└── components/           # 页面专属组件

components/[feature]/
├── [feature]-card.tsx    # 卡片组件
├── [feature]-form.tsx    # 表单组件
├── [feature]-list.tsx    # 列表组件
└── [feature]-dialog.tsx  # 弹窗组件

lib/
├── [feature]/
│   ├── types.ts          # 类型定义
│   ├── validations.ts    # Zod schemas
│   └── utils.ts          # 工具函数

actions/
└── [feature].ts          # Server Actions

lib/db/schema.ts
├── [entity]Table        # 数据库表定义

i18n/messages/
├── en/[feature].json     # 英文翻译
├── zh/[feature].json     # 中文翻译
└── ja/[feature].json     # 日文翻译
```

---

## 核心数据结构

### 数据库 Schema

```typescript
// lib/db/schema/[entity].ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const [entity]Table = pgTable('[entity]', {
  id: serial('id').primaryKey(),
  // ... 字段定义
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### TypeScript 类型

```typescript
// lib/[feature]/types.ts
export interface [Entity] {
  id: string;
  // ... 字段定义
  createdAt: Date;
}

export interface [Entity]Input {
  // ... 创建输入
}

export interface [Entity]Update {
  // ... 更新输入
}
```

### Zod 验证

```typescript
// lib/[feature]/validations.ts
import { z } from 'zod';

export const [entity]InputSchema = z.object({
  // ... 字段验证
});

export const [entity]UpdateSchema = z.object({
  // ... 字段验证
});
```

---

## 接口设计

### Server Actions

```typescript
// actions/[feature].ts
'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { [entity]Table } from '@/lib/db/schema';
import { [entity]InputSchema } from '@/lib/[feature]/validations';
import { actionResponse } from '@/lib/action-response';

export async function create[Entity](data: unknown) {
  // 1. 验证输入
  const validated = [entity]InputSchema.safeParse(data);
  if (!validated.success) {
    return actionResponse.badRequest('Invalid input');
  }

  // 2. 检查权限
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    return actionResponse.unauthorized();
  }

  // 3. 执行操作
  try {
    const result = await db.insert([entity]Table)
      .values(validated.data)
      .returning();

    return actionResponse.success(result[0]);
  } catch (error) {
    return actionResponse.serverError('Operation failed');
  }
}

export async function get[Entity](id: string) {
  // ... 查询逻辑
}

export async function update[Entity](id: string, data: unknown) {
  // ... 更新逻辑
}

export async function delete[Entity](id: string) {
  // ... 删除逻辑
}
```

---

## API 路由（如需要）

```typescript
// app/api/[feature]/route.ts
import { NextResponse } from 'next/server';
import { apiResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  // ... GET 逻辑
}

export async function POST(request: Request) {
  // ... POST 逻辑
}
```

---

## 组件设计

### Server Component (默认)

```typescript
// components/[feature]/[feature]-list.tsx
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { [entity]Table } from '@/lib/db/schema';

export async function [Feature]List() {
  const t = await getTranslations('[Feature].list');
  const items = await db.query.[entity]Table.findMany();

  return (
    <div>
      <h2>{t('title')}</h2>
      {items.map(item => (
        <[Feature]Card key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### Client Component (需要交互时)

```typescript
// components/[feature]/[feature]-form.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { create[Entity] } from '@/actions/[feature]';

export function [Feature]Form() {
  const t = useTranslations('[Feature].form');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const result = await create[Entity](Object.fromEntries(formData));
    setIsSubmitting(false);
    // ... 处理结果
  }

  return (
    <form action={handleSubmit}>
      {/* ... 表单字段 */}
    </form>
  );
}
```

---

## 状态管理

### Server State (默认)
- Server Component 直接获取数据
- 使用 `revalidate` 控制缓存

### Client State (必要时)
```typescript
// stores/[feature]-store.ts
import { create } from 'zustand';

interface [Feature]State {
  // ... 状态定义
}

export const use[Feature]Store = create<[Feature]State>((set) => ({
  // ... 实现
}));
```

---

## 翻译文件结构

```json
// i18n/messages/en/[feature].json
{
  "title": "Feature Title",
  "description": "Feature Description",
  "list": {
    "title": "Items",
    "empty": "No items found"
  },
  "form": {
    "title": "Create Item",
    "submit": "Submit",
    "cancel": "Cancel"
  },
  "errors": {
    "required": "This field is required",
    "invalid": "Invalid input"
  }
}
```

---

## 依赖关系

### 依赖的模块
- `lib/db` - 数据库访问
- `lib/auth` - 认证
- `components/ui` - 基础 UI 组件

### 被依赖的模块
- （列出将依赖此功能的模块）

---

## 测试策略

| 测试类型 | 工具 | 覆盖目标 |
|----------|------|----------|
| 单元测试 | Vitest | 核心逻辑 80%+ |
| 集成测试 | Playwright MCP | 关键流程 |
| E2E 测试 | Playwright MCP | 主要用户路径 |

---

## 部署计划

1. **数据库迁移**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

2. **环境变量**
   - 无需新增 / 或列出需要的环境变量

3. **构建验证**
   ```bash
   pnpm build
   ```

---

## 附录

### 参考资料
- [相关文档链接]
- [技术文档]

### 决策记录
| 决策 | 原因 | 日期 |
|------|------|------|
| XXXX | XXXX | XXXX |

---

*变更历史*
| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 1.0 | YYYY-MM-DD | 初始版本 | XXX |
