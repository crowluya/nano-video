---
name: server-components
description: React Server Components 最佳实践和模式
---

# React Server Components

这是一个关于 React Server Components 最佳实践的技能胶囊。

---

## 核心原则

### 1. 默认 Server Component

不需要交互的组件，不要加 `'use client'`。

```typescript
// ✅ 正确：Server Component（默认）
export default async function VideoList() {
  const videos = await db.query.videos.findMany();

  return (
    <div className="grid gap-4">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
```

### 2. Client Component 最小化

只在真正需要交互时使用 `'use client'`。

```typescript
// ✅ 正确：需要交互才用 Client Component
'use client';

import { useState } from 'react';

export function VideoPlayer({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <button onClick={() => setPlaying(!playing)}>
      {playing ? 'Pause' : 'Play'}
    </button>
  );
}
```

### 3. 数据下沉，交互上浮

- 数据获取在 Server Component
- 交互逻辑在 Client Component

```typescript
// ✅ 正确：组合模式
// Server Component - 获取数据
export default async function VideoPage({ params }: Props) {
  const video = await getVideo(params.id);

  return (
    <div>
      <h1>{video.title}</h1>
      <p>{video.description}</p>
      {/* Client Component - 处理交互 */}
      <VideoPlayer videoId={video.id} />
      <LikeButton videoId={video.id} initialLikes={video.likes} />
    </div>
  );
}
```

---

## 决策树：Server vs Client

```
需要这个组件吗？
│
├─ 使用 useState/useEffect/useReducer?
│   └─ ✅ Client Component
│
├─ 使用浏览器 API (localStorage, window, navigator)?
│   └─ ✅ Client Component
│
├─ 需要事件处理 (onClick, onChange, onSubmit)?
│   └─ ✅ Client Component
│
├─ 使用 React Context?
│   └─ ✅ Client Component
│
├─ 需要获取数据?
│   └─ ❌ Server Component
│
├─ 纯展示/渲染?
│   └─ ❌ Server Component
│
└─ 默认
    └─ ❌ Server Component
```

---

## 常见模式

### 模式 1：数据获取 + 展示

```typescript
// components/video/video-list.tsx (Server Component)
import { db } from '@/lib/db';
import { VideoCard } from './video-card';

export async function VideoList() {
  const videos = await db.query.videos.findMany({
    orderBy: (videos, { desc }) => [desc(videos.createdAt)],
    limit: 20,
  });

  if (videos.length === 0) {
    return <EmptyState message="No videos yet" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
```

### 模式 2：表单处理

```typescript
// components/video/video-form.tsx (Client Component)
'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { createVideo } from '@/actions/video';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function VideoForm() {
  const t = useTranslations('VideoGeneration.form');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createVideo(formData);

      if (result.success) {
        toast.success(t('success'));
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input
        name="prompt"
        placeholder={t('promptPlaceholder')}
        disabled={isPending}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? t('generating') : t('submit')}
      </Button>
    </form>
  );
}
```

### 模式 3：混合组件

```typescript
// app/[locale]/(protected)/dashboard/videos/page.tsx
import { getTranslations } from 'next-intl/server';
import { VideoList } from '@/components/video/video-list';
import { VideoForm } from '@/components/video/video-form';
import { Suspense } from 'react';
import { VideoListSkeleton } from '@/components/video/video-list-skeleton';

export default async function VideosPage() {
  const t = await getTranslations('Dashboard.videos');

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      {/* Client Component - 表单交互 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t('createNew')}</h2>
        <VideoForm />
      </section>

      {/* Server Component - 数据获取，带 Suspense */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t('yourVideos')}</h2>
        <Suspense fallback={<VideoListSkeleton />}>
          <VideoList />
        </Suspense>
      </section>
    </div>
  );
}
```

### 模式 4：条件渲染交互元素

```typescript
// components/video/video-card.tsx (Server Component)
import Image from 'next/image';
import { VideoActions } from './video-actions'; // Client Component

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    likes: number;
  };
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Image
        src={video.thumbnail}
        alt={video.title}
        width={320}
        height={180}
        className="w-full object-cover"
      />
      <div className="p-4">
        <h3 className="font-medium">{video.title}</h3>
        {/* 只有交互部分是 Client Component */}
        <VideoActions videoId={video.id} initialLikes={video.likes} />
      </div>
    </div>
  );
}
```

```typescript
// components/video/video-actions.tsx (Client Component)
'use client';

import { useState } from 'react';
import { Heart, Share2 } from 'lucide-react';
import { likeVideo } from '@/actions/video';

interface VideoActionsProps {
  videoId: string;
  initialLikes: number;
}

export function VideoActions({ videoId, initialLikes }: VideoActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  async function handleLike() {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
    await likeVideo(videoId);
  }

  return (
    <div className="flex items-center gap-4 mt-2">
      <button onClick={handleLike} className="flex items-center gap-1">
        <Heart className={liked ? 'fill-red-500 text-red-500' : ''} size={18} />
        <span>{likes}</span>
      </button>
      <button className="flex items-center gap-1">
        <Share2 size={18} />
      </button>
    </div>
  );
}
```

---

## 性能优化

### Streaming with Suspense

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      {/* 立即渲染 */}
      <Header />

      {/* 流式加载 */}
      <Suspense fallback={<VideoListSkeleton />}>
        <VideoList />
      </Suspense>

      {/* 立即渲染 */}
      <Footer />
    </div>
  );
}
```

### 并行数据获取

```typescript
export default async function Page() {
  // ✅ 并行获取
  const [videos, user, stats] = await Promise.all([
    getVideos(),
    getUser(),
    getStats(),
  ]);

  return (
    <div>
      <UserInfo user={user} />
      <Stats stats={stats} />
      <VideoList videos={videos} />
    </div>
  );
}
```

### 预加载数据

```typescript
import { preload } from 'react-dom';

// 在父组件预加载
export default async function Layout({ children }) {
  // 预加载子页面可能需要的数据
  preloadVideos();

  return <div>{children}</div>;
}

function preloadVideos() {
  void getVideos(); // 开始获取但不等待
}
```

---

## 常见错误

### ❌ 错误：在 Server Component 中使用 hooks

```typescript
// ❌ 错误
export default function VideoList() {
  const [videos, setVideos] = useState([]); // 报错！

  useEffect(() => {
    fetchVideos().then(setVideos);
  }, []);

  return <div>...</div>;
}
```

### ✅ 正确：直接 async/await

```typescript
// ✅ 正确
export default async function VideoList() {
  const videos = await fetchVideos();

  return <div>...</div>;
}
```

### ❌ 错误：过度使用 'use client'

```typescript
// ❌ 错误：整个页面都是 Client Component
'use client';

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  // ...
}
```

### ✅ 正确：最小化 Client 边界

```typescript
// ✅ 正确：页面是 Server，只有交互部分是 Client
export default async function VideosPage() {
  const videos = await getVideos();

  return (
    <div>
      {videos.map(video => (
        <div key={video.id}>
          <h3>{video.title}</h3>
          <LikeButton videoId={video.id} /> {/* 只有这个是 Client */}
        </div>
      ))}
    </div>
  );
}
```

---

## 检查清单

开发新组件时，问自己：

- [ ] 这个组件需要 useState/useEffect 吗？
- [ ] 这个组件需要事件处理吗？
- [ ] 这个组件需要浏览器 API 吗？
- [ ] 能否把交互部分拆成更小的 Client Component？
- [ ] 数据获取是否在 Server Component 完成？
- [ ] 是否使用了 Suspense 优化加载体验？
