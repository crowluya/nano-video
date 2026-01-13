# Nano Banana Video - 跨 Agent 通用规范

> 本文件定义了所有 AI Agent 共享的开发规范和技术栈信息。

---

## 开发环境

### 技术栈
- **语言**: TypeScript 5.x
- **框架**: Next.js 16 (App Router)
- **UI**: React 19
- **样式**: Tailwind CSS 4.x
- **组件库**: Radix UI (shadcn/ui)
- **状态**: React Server Components + Zustand (客户端)
- **数据库**: PostgreSQL (Neon) + Drizzle ORM
- **认证**: better-auth
- **国际化**: next-intl
- **包管理器**: pnpm

### 运行命令
```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产构建
pnpm lint         # ESLint 检查
pnpm db:push      # 推送 schema 到数据库
pnpm db:studio    # 打开数据库管理界面
```

---

## TypeScript 规范

### 类型定义
```typescript
// ✅ 使用 interface 定义对象类型
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// ✅ 使用 type 定义联合类型
type Theme = 'light' | 'dark' | 'system';

// ❌ 禁止使用 any
// ✅ 使用 unknown 代替
function parseInput(input: unknown) {
  // 类型守卫后再使用
}
```

### 组件 Props
```typescript
// ✅ 明确定义 Props 类型
interface ButtonProps {
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'default', children }: ButtonProps) {
  return <button className={variant}>{children}</button>;
}
```

---

## React/Next.js 规范

### Server vs Client Components
```typescript
// ✅ 默认使用 Server Component (无需 'use client')
export default function VideoList() {
  // 可以直接 async
  const videos = await getVideos();
  return <div>{videos.map(...)}</div>;
}

// ✅ 需要交互时添加 'use client'
'use client';
export function VideoPlayer() {
  const [playing, setPlaying] = useState(false);
  return <button onClick={() => setPlaying(true)}>Play</button>;
}
```

### 文件命名
- 组件文件: `PascalCase.tsx` (如 `VideoCard.tsx`)
- 工具文件: `kebab-case.ts` (如 `format-date.ts`)
- 类型文件: `*.types.ts` 或 `*.schema.ts`

---

## 国际化规范

### 翻译文件位置
```
i18n/messages/
├── en/
│   ├── common.json      # 通用翻译
│   ├── Landing.json     # 首页翻译
│   └── ...
├── zh/
│   ├── common.json
│   ├── Landing.json
│   └── ...
└── ja/
    ├── common.json
    ├── Landing.json
    └── ...
```

### 使用翻译
```typescript
// ✅ 客户端组件
import { useTranslations } from 'next-intl';

export function Hero() {
  const t = useTranslations('Landing.hero');
  return <h1>{t('title')}</h1>;
}

// ✅ 服务端组件
import { getTranslations } from 'next-intl/server';

export async function ServerComponent() {
  const t = await getTranslations('Landing.hero');
  return <h1>{t('title')}</h1>;
}
```

### 翻译 Key 命名
- 使用命名空间: `Landing.hero.title`
- 层级不超过 3 层
- 使用 camelCase

---

## API 规范

### API 路由
```typescript
// app/api/videos/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const videos = await db.query.videos.findMany();
  return NextResponse.json(videos);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 处理逻辑
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
```

### Server Actions
```typescript
// app/actions/video.ts
'use server';

export async function createVideo(formData: FormData) {
  const title = formData.get('title') as string;
  // 处理逻辑
  return { success: true };
}
```

---

## 数据库规范

### Schema 定义
```typescript
// lib/db/schema/videos.ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 查询
```typescript
import { db } from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// 查询单条
const video = await db.query.videos.findFirst({
  where: eq(videos.id, id),
});

// 查询列表
const allVideos = await db.query.videos.findMany();

// 插入
await db.insert(videos).values({ title: 'New Video' });
```

---

## 样式规范

### Tailwind CSS
```typescript
// ✅ 使用 clsx + tailwind-merge
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function Button({ variant = 'primary', className }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded font-medium',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800',
        className
      )}
    />
  );
}
```

---

## Git 规范

### Commit 格式
```
feat(scope): description
fix(scope): description
docs(scope): description
style(scope): description
refactor(scope): description
test(scope): description
chore(scope): description
i18n(locale): description
```

### 示例
```
feat(video): add Sora model support
fix(auth): resolve session timeout
i18n(zh): add missing translations for landing page
refactor(player): extract video player to separate component
```

---

## 安全规范

### 环境变量
- 所有密钥使用环境变量
- 禁止在客户端代码中暴露敏感信息
- 使用 `.env.local` 本地开发，不提交到 Git

### 输入验证
```typescript
import { z } from 'zod';

const videoSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().url(),
});

export async function createVideo(data: unknown) {
  const validated = videoSchema.parse(data);
  // 使用 validated 数据
}
```

---

## 浏览器操作规范

### Playwright MCP 优先
所有浏览器自动化必须使用 Playwright MCP 工具：

```
browser_navigate → browser_wait_for → browser_snapshot
→ browser_click/type → browser_close
```

### 可用指令
- `/screenshot <url>` - 网页截图
- `/form-test <url>` - 表单测试
- `playwright-browser` 子代理 - 复杂任务

---

## 常见问题

### Q: 如何判断使用 Server 还是 Client Component?
A: 默认 Server。需要以下情况才用 Client:
- 使用 useState/useEffect 等 hooks
- 需要浏览器 API (localStorage, window 等)
- 需要事件处理 (onClick, onChange 等)

### Q: 翻译 key 在哪个文件?
A: 根据页面和组件位置查找:
- 首页: `i18n/messages/{locale}/Landing.json`
- 通用: `i18n/messages/{locale}/common.json`
- 特定页面: 对应的 JSON 文件

### Q: 如何添加新页面?
A: 在 `app/[locale]/(basic-layout)/` 下创建目录和 page.tsx，同时添加翻译。
