# Gallery 功能开发 TODO

> 参考: https://nanobananavideo.com/#quality

---

## Phase 1: 素材准备

### 1.1 Hero 背景视频 (3个)

| 编号 | Prompt 主题 | 风格 | 时长 | 状态 |
|------|-------------|------|------|------|
| hero-1 | 电影感城市日落，镜头缓慢平移 | Cinematic | 5-10s | ⬜ |
| hero-2 | 科技感 AI 神经网络动画 | Tech/Abstract | 5-10s | ⬜ |
| hero-3 | 创意工作室，创作者使用电脑 | Lifestyle | 5-10s | ⬜ |

### 1.2 Realistic 风格视频 (3个)

| 编号 | Prompt 主题 | 说明 | 状态 |
|------|-------------|------|------|
| realistic-1 | 时尚模特街拍，金色时刻光线 | 商业广告感 | ⬜ |
| realistic-2 | 产品特写，咖啡杯蒸汽升起 | 产品展示 | ⬜ |
| realistic-3 | 人物特写，电影质感浅景深 | 人像视频 | ⬜ |

### 1.3 UGC 风格视频 (3个)

| 编号 | Prompt 主题 | 说明 | 状态 |
|------|-------------|------|------|
| ugc-1 | TikTok 风格产品开箱 | 竖屏 9:16 | ⬜ |
| ugc-2 | 活力年轻人跳舞/运动 | 社交媒体感 | ⬜ |
| ugc-3 | 美食制作过程 | 生活方式 | ⬜ |

### 1.4 3D Animation 风格视频 (3个)

| 编号 | Prompt 主题 | 说明 | 状态 |
|------|-------------|------|------|
| 3d-1 | 卡通角色走路动画 | Pixar 风格 | ⬜ |
| 3d-2 | Logo 3D 旋转动画 | 品牌展示 | ⬜ |
| 3d-3 | 产品 3D 展示旋转 | 电商产品 | ⬜ |

### 1.5 案例 Base Image (3-5张)

| 编号 | 主题 | 用途 | 状态 |
|------|------|------|------|
| case-base-1 | 专业模特肖像 | 时尚广告案例 | ⬜ |
| case-base-2 | 产品图 (手提包/手机) | 产品植入案例 | ⬜ |
| case-base-3 | 咖啡师/创业者 | 品牌故事案例 | ⬜ |

### 1.6 案例输出视频 (3-5个)

| 编号 | Base Image | Prompt | 状态 |
|------|------------|--------|------|
| case-video-1 | case-base-1 | 模特在城市街道行走，携带设计师手提包 | ⬜ |
| case-video-2 | case-base-2 | 产品在桌面旋转展示，柔和灯光 | ⬜ |
| case-video-3 | case-base-3 | 咖啡师制作咖啡，温馨咖啡店环境 | ⬜ |

---

## Phase 2: 组件开发

### 2.1 Gallery 主组件

| 任务 | 文件 | 状态 |
|------|------|------|
| 创建 Gallery 容器组件 | `components/gallery/Gallery.tsx` | ⬜ |
| 添加标题和描述 | - | ⬜ |
| 集成 StyleTabs | - | ⬜ |
| 集成 VideoGrid | - | ⬜ |

### 2.2 VideoCard 组件

| 任务 | 文件 | 状态 |
|------|------|------|
| 创建视频卡片组件 | `components/gallery/VideoCard.tsx` | ⬜ |
| 视频播放/暂停控制 | - | ⬜ |
| Hover 效果 | - | ⬜ |
| 视频时长显示 | - | ⬜ |
| 缩略图加载 | - | ⬜ |

### 2.3 StyleTabs 组件

| 任务 | 文件 | 状态 |
|------|------|------|
| 创建风格切换 Tabs | `components/gallery/StyleTabs.tsx` | ⬜ |
| Realistic 标签 | - | ⬜ |
| UGC 标签 | - | ⬜ |
| 3D Animation 标签 | - | ⬜ |
| 切换动画效果 | - | ⬜ |

### 2.4 CaseStudy 组件

| 任务 | 文件 | 状态 |
|------|------|------|
| 创建案例展示组件 | `components/gallery/CaseStudy.tsx` | ⬜ |
| Base Image 展示 | - | ⬜ |
| Prompt 展示 | - | ⬜ |
| 生成视频展示 | - | ⬜ |
| 流程箭头/连接线 | - | ⬜ |

### 2.5 i18n 翻译

| 任务 | 文件 | 状态 |
|------|------|------|
| 英文翻译 | `i18n/messages/en/Gallery.json` | ⬜ |
| 中文翻译 | `i18n/messages/zh/Gallery.json` | ⬜ |
| 日文翻译 | `i18n/messages/ja/Gallery.json` | ⬜ |

---

## Phase 3: 集成

### 3.1 首页集成

| 任务 | 说明 | 状态 |
|------|------|------|
| 在首页添加 Gallery 区块 | 放在 Features 和 Video Demo 之间 | ⬜ |
| 添加导航锚点 `#gallery` | Header 导航添加链接 | ⬜ |
| 更新 i18n 导航翻译 | - | ⬜ |

### 3.2 性能优化

| 任务 | 说明 | 状态 |
|------|------|------|
| 视频懒加载 | Intersection Observer | ⬜ |
| 视频预加载策略 | 仅预加载可见视频 | ⬜ |
| 缩略图占位 | 加载前显示缩略图 | ⬜ |
| 移动端适配 | 响应式布局 | ⬜ |

### 3.3 视频存储

| 任务 | 说明 | 状态 |
|------|------|------|
| 上传视频到 R2 | Cloudflare R2 存储 | ⬜ |
| 配置 CDN | 视频加速 | ⬜ |
| 视频压缩 | 优化文件大小 | ⬜ |

---

## 文件结构

```
public/
├── videos/
│   ├── hero/
│   │   ├── hero-1.mp4
│   │   ├── hero-2.mp4
│   │   └── hero-3.mp4
│   └── gallery/
│       ├── realistic-1.mp4
│       ├── realistic-2.mp4
│       ├── realistic-3.mp4
│       ├── ugc-1.mp4
│       ├── ugc-2.mp4
│       ├── ugc-3.mp4
│       ├── 3d-1.mp4
│       ├── 3d-2.mp4
│       └── 3d-3.mp4
└── images/
    └── gallery/
        ├── case-base-1.webp
        ├── case-base-2.webp
        ├── case-base-3.webp
        └── thumbnails/
            ├── hero-1.webp
            ├── realistic-1.webp
            └── ...

components/
└── gallery/
    ├── index.ts
    ├── Gallery.tsx
    ├── VideoCard.tsx
    ├── StyleTabs.tsx
    └── CaseStudy.tsx

i18n/messages/
├── en/Gallery.json
├── zh/Gallery.json
└── ja/Gallery.json
```

---

## 生成脚本

```bash
# 生成 Gallery 视频素材
pnpm tsx scripts/generate-gallery-videos.ts

# 生成 Gallery 图片素材
pnpm tsx scripts/generate-gallery-images.ts

# 生成视频缩略图
pnpm tsx scripts/generate-video-thumbnails.ts
```

---

## 参考资源

- 参考网站: https://nanobananavideo.com/#quality
- kie.ai 视频生成: Veo 3.1 / Sora 2
- kie.ai 图片生成: Nano Banana Pro

---

## 进度追踪

| Phase | 进度 | 状态 |
|-------|------|------|
| Phase 1: 素材准备 | 0/18 | ⬜ 未开始 |
| Phase 2:15 | ⬜ 未开始 |
| Phase 3: 页面集成 | 0/9 | ⬜ 未开始 |
| **总计** | **0/42** | **⬜ 未开始** |
