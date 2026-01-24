# Gallery 功能实施计划

> **项目**: Nano Banana Video - Gallery 视频展示功能
> **创建日期**: 2026-01-24
> **参考**: https://nanobananavideo.com/#quality
> **目标位置**: 首页 Features 和 Video Demo 之间

---

## 📋 目录

1. [功能概述](#1-功能概述)
2. [技术架构](#2-技术架构)
3. [数据结构设计](#3-数据结构设计)
4. [组件设计](#4-组件设计)
5. [实施步骤](#5-实施步骤)
6. [性能优化策略](#6-性能优化策略)
7. [测试计划](#7-测试计划)
8. [风险和依赖](#8-风险和依赖)

---

## 1. 功能概述

### 1.1 目标

展示 AI 视频生成的质量和多样性，通过不同风格的视频案例吸引用户，提升产品可信度。

### 1.2 核心功能

| 功能模块 | 描述 | 优先级 |
|---------|------|--------|
| 风格分类展示 | Realistic/UGC/3D Animation 三种风格切换 | P0 |
| 视频网格展示 | 每种风格 3 个视频卡片，共 9 个视频 | P0 |
| 视频交互功能 | Hover 自动播放、显示时长、缩略图占位 | P1 |
| 响应式布局 | 桌面端 3 列、平板 2 列、移动端 1 列 | P1 |

### 1.3 MVP 范围

**✅ 包含**:
- Gallery 主组件
- StyleTabs 风格切换 (3 个 Tab)
- VideoGrid 视频网格 (每种风格 3 个视频)
- VideoCard 视频卡片 (基础播放功能)
- 国际化支持 (en/zh/ja)
- 响应式布局

**❌ 不包含** (后续迭代):
- Hero 背景视频轮播
- CaseStudy 案例展示 (Image → Prompt → Video)
- 视频全屏播放
- 视频下载功能
- 视频评论/点赞

---

## 2. 技术架构

### 2.1 组件层级结构

```
NanoBananaGallery (主容器)
├── GalleryHeader (标题和描述)
├── StyleTabs (风格切换)
│   ├── Tab: Realistic
│   ├── Tab: UGC
│   └── Tab: 3D Animation
└── VideoGrid (视频网格)
    └── VideoCard × 9
        ├── 缩略图占位
        ├── 视频播放器
        ├── 视频信息 (标题、描述)
        └── 时长标签
```

### 2.2 技术栈

| 技术 | 用途 |
|------|------|
| React 19 | 组件框架 |
| TypeScript | 类型安全 |
| next-intl | 国际化 |
| Tailwind CSS | 样式 |
| shadcn/ui | UI 组件库 (Tabs) |
| HTML5 Video | 视频播放 |
| Intersection Observer | 懒加载 |

### 2.3 文件结构

```
components/nanabananvideo/
├── Gallery.tsx                 # 主组件 (新建)
└── gallery/                    # 子组件目录 (新建)
    ├── VideoCard.tsx           # 视频卡片 (新建)
    └── StyleTabs.tsx           # 风格切换 (新建)

i18n/messages/
├── en/NanoBananaVideo.json     # 添加 Gallery 翻译
├── zh/NanoBananaVideo.json     # 添加 Gallery 翻译
└── ja/NanoBananaVideo.json     # 添加 Gallery 翻译

R2 存储:
website/gallery/
├── realistic/
│   ├── realistic-1.mp4
│   ├── realistic-2.mp4
│   └── realistic-3.mp4
├── ugc/
│   ├── ugc-1.mp4
│   ├── ugc-2.mp4
│   └── ugc-3.mp4
└── 3d/
    ├── 3d-1.mp4
    ├── 3d-2.mp4
    └── 3d-3.mp4

website/gallery/thumbnails/
├── realistic-1.webp
├── realistic-2.webp
... (共 9 个缩略图)
```

### 2.4 页面集成位置

```typescript
// components/nanabananvideo/index.tsx

{messages.NanoBananaVideo?.Features && <NanoBananaFeatures />}
{messages.NanoBananaVideo?.Gallery && <NanoBananaGallery />}  // 👈 插入位置
<VideoGenerationDemo />
```

---

## 3. 数据结构设计

### 3.1 TypeScript 类型定义

```typescript
// 视频分类类型
type GalleryCategory = 'realistic' | 'ugc' | '3d';

// 单个视频数据类型
type GalleryVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;        // R2 CDN URL
  thumbnailUrl: string;    // 缩略图 URL
  duration: number;        // 时长（秒）
  category: GalleryCategory;
};

// 分类数据类型
type CategoryData = {
  title: string;
  description: string;
  videos: GalleryVideo[];
};

// Gallery 主数据类型
type GalleryData = {
  realistic: CategoryData;
  ugc: CategoryData;
  '3d': CategoryData;
};
```

### 3.2 示例数据

```typescript
const galleryData: GalleryData = {
  realistic: {
    title: "Realistic Style",
    description: "Professional quality realistic videos",
    videos: [
      {
        id: "realistic-1",
        title: "Fashion Model Street Shot",
        description: "Golden hour lighting, commercial feel",
        videoUrl: "https://cdn.nanobananavideo.net/website/gallery/realistic/realistic-1.mp4",
        thumbnailUrl: "https://cdn.nanobananavideo.net/website/gallery/thumbnails/realistic-1.webp",
        duration: 8,
        category: "realistic"
      },
      // ... 更多视频
    ]
  },
  // ... ugc 和 3d
};
```

### 3.3 i18n 数据结构

```json
{
  "Gallery": {
    "badge": {
      "label": "QUALITY",
      "text": "Video Quality Gallery"
    },
    "title": "Stunning AI-Generated Videos",
    "description": "Explore our gallery of videos created with Sora 2 and Veo 3.1",
    "tabs": {
      "realistic": "Realistic",
      "ugc": "UGC Style",
      "3d": "3D Animation"
    },
    "categories": {
      "realistic": {
        "title": "Realistic Style Videos",
        "description": "Professional quality realistic videos",
        "videos": [
          {
            "id": "realistic-1",
            "title": "Fashion Model Street Shot",
            "description": "Golden hour lighting, commercial feel"
          }
        ]
      }
    }
  }
}
```

---

## 4. 组件设计

### 4.1 NanoBananaGallery (主组件)

**文件**: `components/nanabananvideo/Gallery.tsx`

**职责**:
- 获取 i18n 翻译数据
- 管理当前选中的 Tab 状态
- 渲染子组件

**核心代码**:
```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import GalleryHeader from './gallery/GalleryHeader';
import StyleTabs from './gallery/StyleTabs';
import VideoGrid from './gallery/VideoGrid';

export default function NanoBananaGallery() {
  const t = useTranslations('NanoBananaVideo.Gallery');
  const [activeTab, setActiveTab] = useState<'realistic' | 'ugc' | '3d'>('realistic');

  return (
    <section id="gallery" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <GalleryHeader />
        <StyleTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <VideoGrid category={activeTab} />
      </div>
    </section>
  );
}
```

### 4.2 VideoCard (视频卡片)

**文件**: `components/nanabananvideo/gallery/VideoCard.tsx`

**职责**:
- 显示视频缩略图/播放器
- Hover 自动播放
- 显示视频信息

**核心功能**:
```typescript
'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

interface VideoCardProps {
  video: GalleryVideo;
}

export function VideoCard({ video }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleMouseEnter = () => {
    if (videoRef.current && isLoaded) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div
      className="group relative rounded-lg overflow-hidden border"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 缩略图/视频 */}
      {!isPlaying ? (
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          width={640}
          height={360}
          className="w-full aspect-video object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          src={video.videoUrl}
          loop
          muted
          playsInline
          className="w-full aspect-video object-cover"
          onLoadedData={() => setIsLoaded(true)}
        />
      )}

      {/* 时长标签 */}
      <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
        {video.duration}s
      </span>

      {/* 视频信息 */}
      <div className="p-4">
        <h3 className="font-semibold mb-1">{video.title}</h3>
        <p className="text-sm text-muted-foreground">{video.description}</p>
      </div>
    </div>
  );
}
```

### 4.3 StyleTabs (风格切换)

**文件**: `components/nanabananvideo/gallery/StyleTabs.tsx`

**职责**:
- 显示 3 个风格 Tab
- 处理 Tab 切换
- 切换动画效果

**核心代码**:
```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StyleTabsProps {
  activeTab: 'realistic' | 'ugc' | '3d';
  onTabChange: (tab: 'realistic' | 'ugc' | '3d') => void;
}

export function StyleTabs({ activeTab, onTabChange }: StyleTabsProps) {
  const t = useTranslations('NanoBananaVideo.Gallery.tabs');

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mb-8">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
        <TabsTrigger value="realistic">{t('realistic')}</TabsTrigger>
        <TabsTrigger value="ugc">{t('ugc')}</TabsTrigger>
        <TabsTrigger value="3d">{t('3d')}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

### 4.4 VideoGrid (视频网格)

**文件**: `components/nanabananvideo/gallery/VideoGrid.tsx`

**职责**:
- 根据分类显示对应视频
- 响应式网格布局

**核心代码**:
```typescript
'use client';

import { useTranslations } from 'next-intl';
import { VideoCard } from './VideoGrid';

interface VideoGridProps {
  category: 'realistic' | 'ugc' | '3d';
}

export function VideoGrid({ category }: VideoGridProps) {
  const t = useTranslations('NanoBananaVideo.Gallery.categories');
  const videos = t.raw(`${category}.videos`);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video: GalleryVideo) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
```

---

## 5. 实施步骤

### Phase 1: 素材准备 (预计 2-3 小时)

**任务清单**:

1.1 生成 Realistic 风格视频 (3个)
- [ ] 使用 Veo 3.1 Fast 生成
- [ ] 视频规格: 1080p, 5-10秒, MP4
- [ ] 主题:
  - realistic-1: 时尚模特街拍
  - realistic-2: 产品特写
  - realistic-3: 人物特写

1.2 生成 UGC 风格视频 (3个)
- [ ] 使用 Veo 3.1 Fast 生成
- [ ] 视频规格: 9:16 竖屏, 5-10秒, MP4
- [ ] 主题:
  - ugc-1: TikTok 产品开箱
  - ugc-2: 年轻人跳舞/运动
  - ugc-3: 美食制作

1.3 生成 3D Animation 风格视频 (3个)
- [ ] 使用 Sora 2 生成
- [ ] 视频规格: 1080p, 5-10秒, MP4
- [ ] 主题:
  - 3d-1: 卡通角色走路
  - 3d-2: Logo 3D 旋转
  - 3d-3: 产品 3D 展示

1.4 生成缩略图 (9个)
- [ ] 从每个视频提取首帧
- [ ] 转换为 webp 格式
- [ ] 上传到 R2

1.5 上传到 R2
- [ ] 上传视频到 `website/gallery/{category}/`
- [ ] 上传缩略图到 `website/gallery/thumbnails/`
- [ ] 验证 CDN 访问

**生成脚本** (可选):
```bash
# 批量生成 Gallery 视频
pnpm tsx scripts/generate-gallery-videos.ts
```

---

### Phase 2: 组件开发 (预计 3-4 小时)

**任务清单**:

2.1 创建 Gallery 主组件
- [ ] 创建 `components/nanabananvideo/Gallery.tsx`
- [ ] 实现状态管理 (activeTab)
- [ ] 集成子组件
- [ ] 添加 section ID 和样式

2.2 创建 VideoCard 组件
- [ ] 创建 `components/nanabananvideo/gallery/VideoCard.tsx`
- [ ] 实现视频播放/暂停
- [ ] 实现 Hover 效果
- [ ] 添加缩略图占位
- [ ] 显示时长标签
- [ ] 添加视频信息

2.3 创建 StyleTabs 组件
- [ ] 创建 `components/nanabananvideo/gallery/StyleTabs.tsx`
- [ ] 使用 shadcn/ui Tabs
- [ ] 实现 3 个 Tab
- [ ] 添加切换动画

2.4 创建 VideoGrid 组件
- [ ] 创建 `components/nanabananvideo/gallery/VideoGrid.tsx`
- [ ] 实现响应式网格布局
- [ ] 集成 VideoCard

2.5 创建 GalleryHeader 组件
- [ ] 创建标题和描述
- [ ] 参考 Features 组件的样式
- [ ] 添加 badge (可选)

---

### Phase 3: 国际化配置 (预计 1 小时)

**任务清单**:

3.1 添加英文翻译
- [ ] 编辑 `i18n/messages/en/NanoBananaVideo.json`
- [ ] 添加 Gallery 相关翻译 key

3.2 添加中文翻译
- [ ] 编辑 `i18n/messages/zh/NanoBananaVideo.json`
- [ ] 翻译所有文本

3.3 添加日文翻译
- [ ] 编辑 `i18n/messages/ja/NanoBananaVideo.json`
- [ ] 翻译所有文本

**翻译 Key 结构**:
```json
{
  "Gallery": {
    "badge": {
      "label": "QUALITY",
      "text": "Video Quality Gallery"
    },
    "title": "Stunning AI-Generated Videos",
    "description": "Explore our gallery of videos created with Sora 2 and Veo 3.1",
    "tabs": {
      "realistic": "Realistic",
      "ugc": "UGC Style",
      "3d": "3D Animation"
    },
    "categories": {
      "realistic": {
        "title": "Realistic Style Videos",
        "description": "Professional quality realistic videos",
        "videos": [
          {
            "id": "realistic-1",
            "title": "Fashion Model Street Shot",
            "description": "Golden hour lighting, commercial feel"
          }
        ]
      },
      "ugc": { ... },
      "3d": { ... }
    }
  }
}
```

---

### Phase 4: 页面集成 (预计 0.5 小时)

**任务清单**:

4.1 修改首页组件
- [ ] 编辑 `components/nanabananvideo/index.tsx`
- [ ] 导入 `NanoBananaGallery`
- [ ] 在 Features 和 VideoGenerationDemo 之间插入
- [ ] 添加条件渲染 (基于 i18n)

4.2 添加导航链接 (可选)
- [ ] 编辑 Header 组件
- [ ] 添加 Gallery 导航链接
- [ ] 链接到 `#gallery`

**修改示例**:
```typescript
// components/nanabananvideo/index.tsx
import NanoBananaGallery from "@/components/nanabananvideo/Gallery";

export default async function NanoBananaVideoPage() {
  // ...
  return (
    <div className="w-full">
      {/* ... */}
      {messages.NanoBananaVideo?.Features && <NanoBananaFeatures />}
      {messages.NanoBananaVideo?.Gallery && <NanoBananaGallery />}
      <VideoGenerationDemo />
      {/* ... */}
    </div>
  );
}
```

---

### Phase 5: 性能优化 (预计 1-2 小时)

**任务清单**:

5.1 视频懒加载
- [ ] 使用 Intersection Observer
- [ ] 仅在可见时加载视频
- [ ] 优先加载当前 Tab 的视频

5.2 预加载策略
- [ ] 预加载当前 Tab 的视频
- [ ] 切换 Tab 时预加载新视频
- [ ] 避免同时加载过多视频

5.3 缩略图优化
- [ ] 使用 webp 格式
- [ ] 压缩缩略图大小
- [ ] 使用 Next.js Image 组件优化

5.4 移动端适配
- [ ] 响应式网格布局 (1/2/3 列)
- [ ] 移动端降低视频质量 (可选)
- [ ] 触摸设备优化

**懒加载实现示例**:
```typescript
const [isVisible, setIsVisible] = useState(false);
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    },
    { threshold: 0.1 }
  );

  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
}, []);

return (
  <div ref={ref}>
    {isVisible && <video src={videoUrl} ... />}
  </div>
);
```

---

### Phase 6: 测试验证 (预计 1 小时)

**任务清单**:

6.1 功能测试
- [ ] 视频播放/暂停功能
- [ ] Tab 切换功能
- [ ] Hover 效果测试
- [ ] 视频信息显示

6.2 响应式测试
- [ ] 桌面端 (1920x1080)
- [ ] 平板端 (768x1024)
- [ ] 移动端 (375x667)

6.3 性能测试
- [ ] Lighthouse 性能评分
- [ ] 首屏加载时间
- [ ] 视频加载速度

6.4 多语言测试
- [ ] 英文版本
- [ ] 中文版本
- [ ] 日文版本

6.5 浏览器兼容性
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

---

## 6. 性能优化策略

### 6.1 视频优化

| 优化项 | 策略 | 预期效果 |
|--------|------|----------|
| 文件大小 | 限制单视频 < 5MB | 减少加载时间 |
| 编码格式 | H.264, MP4 | 最佳兼容性 |
| 分辨率 | 1080p (桌面), 720p (移动) | 适配不同设备 |
| 时长 | 5-10 秒 | 平衡质量和大小 |

### 6.2 加载优化

| 优化项 | 策略 | 预期效果 |
|--------|------|----------|
| 懒加载 | Intersection Observer | 减少初始加载 |
| 预加载 | 预加载当前 Tab 视频 | 提升切换体验 |
| 缩略图 | webp 格式, < 100KB | 快速占位 |
| CDN | R2 CDN 加速 | 全球分发 |

### 6.3 代码优化

```typescript
// ✅ 使用 useMemo 缓存计算结果
const videos = useMemo(() => {
  return t.raw(`Gallery.categories.${category}.videos`);
}, [t, category]);

// ✅ 使用 useCallback 缓存事件处理
const handleTabChange = useCallback((tab: string) => {
  setActiveTab(tab);
}, []);

// ✅ 条件渲染避免不必要加载
{isVisible && <VideoCard video={video} />}
```

---

## 7. 测试计划

### 7.1 单元测试

```typescript
// __tests__/components/Gallery.test.tsx
describe('NanoBananaGallery', () => {
  it('should render gallery header', () => {
    // ...
  });

  it('should switch tabs correctly', () => {
    // ...
  });

  it('should display correct videos for each category', () => {
    // ...
  });
});
```

### 7.2 集成测试

- [ ] 首页加载 Gallery 组件
- [ ] 点击 Tab 切换视频
- [ ] Hover 播放视频
- [ ] 移动端触摸交互

### 7.3 性能测试

```bash
# Lighthouse 性能测试
pnpm build
pnpm start
# 在 Chrome DevTools 运行 Lighthouse

# 目标:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 95
# - SEO: > 95
```

---

## 8. 风险和依赖

### 8.1 风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 视频生成质量不稳定 | 展示效果不佳 | 多次生成选择最佳版本 |
| 视频文件过大 | 加载慢 | 压缩视频，限制大小 |
| R2 配置问题 | 无法访问 | 提前测试 R2 上传 |
| 移动端性能问题 | 体验差 | 降低移动端视频质量 |

### 8.2 依赖

| 依赖 | 状态 | 说明 |
|------|------|------|
| R2 存储 | ✅ 已配置 | website/gallery/ 路径 |
| kie.ai API | ✅ 可用 | 视频生成 |
| CDN | ✅ 已配置 | cdn.nanobananavideo.net |
| shadcn/ui Tabs | ✅ 已安装 | UI 组件 |

### 8.3 外部依赖

- ✅ Next.js 16 + React 19
- ✅ next-intl 国际化
- ✅ Tailwind CSS
- ✅ TypeScript

---

## 9. 工作量评估

| 阶段 | 预估时间 | 说明 |
|------|---------|------|
| Phase 1: 素材准备 | 2-3 小时 | 生成 9 个视频 + 9 个缩略图 |
| Phase 2: 组件开发 | 3-4 小时 | 开发 4 个组件 |
| Phase 3: 国际化配置 | 1 小时 | 添加翻译 |
| Phase 4: 页面集成 | 0.5 小时 | 集成到首页 |
| Phase 5: 性能优化 | 1-2 小时 | 懒加载、响应式 |
| Phase 6: 测试验证 | 1 小时 | 功能和性能测试 |
| **总计** | **8.5-11.5 小时** | MVP 版本 |

---

## 10. 下一步行动

### 10.1 立即开始

**选项 A: 先开发组件 (推荐)**
- 使用占位视频/图片快速搭建
- 验证组件功能和交互
- 后续替换真实素材

**选项 B: 先准备素材**
- 使用 kie.ai 生成 9 个视频
- 上传到 R2
- 然后开发组件

### 10.2 实施优先级

**P0 (必须完成)**:
1. Gallery 主组件
2. VideoCard 基础功能
3. StyleTabs 切换
4. 基础国际化

**P1 (重要)**:
1. 视频懒加载
2. 响应式布局
3. 性能优化

**P2 (可选)**:
1. 高级动画效果
2. 视频全屏播放
3. CaseStudy 案例

---

## 11. 成功标准

### 11.1 功能完整性

- ✅ 3 种风格切换正常
- ✅ 每种风格显示 3 个视频
- ✅ 视频 Hover 自动播放
- ✅ 响应式布局正常
- ✅ 多语言支持完整

### 11.2 性能指标

- ✅ 首屏加载时间 < 2 秒
- ✅ Lighthouse Performance > 90
- ✅ 视频加载时间 < 1 秒
- ✅ 移动端流畅度 > 60fps

### 11.3 用户体验

- ✅ Tab 切换流畅
- ✅ 视频播放无卡顿
- ✅ 移动端触摸友好
- ✅ 视觉效果美观

---

## 附录 A: 参考资源

- **参考网站**: https://nanobananavideo.com/#quality
- **组件参考**: `components/nanabananvideo/Features.tsx`
- **i18n 文档**: https://next-intl-docs.vercel.app/
- **shadcn/ui Tabs**: https://ui.shadcn.com/docs/components/tabs
- **Intersection Observer**: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

---

## 附录 B: 生成脚本示例

```typescript
// scripts/generate-gallery-videos.ts
import { generateVideo } from '@/lib/kie/video-gen';

async function generateGalleryVideos() {
  const videos = [
    { id: 'realistic-1', prompt: '...', model: 'veo3_fast' },
    { id: 'realistic-2', prompt: '...', model: 'veo3_fast' },
    // ... 更多视频
  ];

  for (const video of videos) {
    console.log(`Generating ${video.id}...`);
    const result = await generateVideo(video.prompt, video.model);
    console.log(`✅ ${video.id} completed: ${result.url}`);
  }
}

generateGalleryVideos();
```

---

**文档版本**: v1.0
**最后更新**: 2026-01-24
**状态**: ✅ 已完成
