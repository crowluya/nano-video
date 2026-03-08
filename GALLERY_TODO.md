# Gallery 状态同步

> 同步时间：2026-03-08
> 说明：本文件已从“开发 TODO”改为“真实状态 + 剩余事项”。原文档中“Gallery 未开始”的结论已过期。

---

## 一、当前真实状态

### 已完成

- [x] Gallery 主组件已存在
  - 文件：`components/nanabananvideo/Gallery.tsx`

- [x] VideoCard 组件已存在
  - 文件：`components/nanabananvideo/gallery/VideoCard.tsx`

- [x] 三个分类 Tabs 已实现
  - `realistic`
  - `ugc`
  - `3d`

- [x] Gallery 已接入首页主产品页
  - 入口组件：`components/nanabananvideo/index.tsx`
  - 当前顺序：`UseCases` 之后，`Pricing` 之前

- [x] Gallery 锚点已存在
  - `Gallery.tsx` 中 section id 为 `gallery`
  - `Hero.tsx` 中已提供 `/#gallery` 按钮入口

- [x] EN / ZH / JA Gallery 文案已存在
  - 位置不是原计划的独立 `Gallery.json`
  - 当前实际集成在：
    - `i18n/messages/en/NanoBananaVideo.json`
    - `i18n/messages/zh/NanoBananaVideo.json`
    - `i18n/messages/ja/NanoBananaVideo.json`

- [x] 视频资源已接入 CDN
  - 不是原计划的 `public/videos/...`
  - 当前实际使用 `https://cdn.nanobananavideo.net/website/gallery/...`

- [x] Hero 区域也已复用 Gallery 视频素材
  - 轮播视频来自相同 CDN 路径

### 部分完成

- [~] 视频卡片已有播放/暂停交互
  - hover 自动播放
  - 移出后暂停并重置
  - 有固定 `10s` 时长 badge
  - 但还没有真实时长读取逻辑

- [~] 占位状态已存在
  - 视频加载前有 Loading 占位
  - 但没有 poster 缩略图体系

- [~] 响应式布局已存在
  - 1 列 / 2 列 / 3 列网格已实现
  - 但没有专门做移动端性能策略

### 未完成

- [ ] Header 导航中没有单独的 Gallery 链接
- [ ] 没有独立的 CaseStudy 组件
- [ ] 没有缩略图资源或 poster 图体系
- [ ] 没有 Intersection Observer 懒加载策略
- [ ] 没有“仅预加载可见视频”的策略
- [ ] 没有明确的视频压缩/转码文档

---

## 二、和原计划的主要偏差

### 文件结构已经变化

原计划：

- `components/gallery/Gallery.tsx`
- `components/gallery/VideoCard.tsx`
- `i18n/messages/en/Gallery.json`

当前实际：

- `components/nanabananvideo/Gallery.tsx`
- `components/nanabananvideo/gallery/VideoCard.tsx`
- 文案合并在 `NanoBananaVideo.json`

### 资源策略已经变化

原计划：

- 本地静态资源放 `public/videos/` 和 `public/images/gallery/`

当前实际：

- Gallery 视频直接走 CDN
- 仓库里没有对应的本地 `public/videos/gallery/*`
- 也没有原计划里的 `public/images/gallery/thumbnails/*`

### 集成位置和原文不同

原计划写的是“放在 Features 和 Video Demo 之间”。

当前实际顺序是：

1. Hero
2. KeyFeatures
3. Features
4. VideoGenerationDemo
5. ImageGenerationDemo
6. UseCases
7. Gallery
8. Pricing
9. FAQ
10. CTA

---

## 三、当前仍值得做的任务

### P1

- [ ] 在 Header 导航增加 Gallery 链接
- [ ] 给视频卡片增加 poster 或缩略图
- [ ] 给视频卡片接入真实时长，而不是写死 `10s`
- [ ] 为 Gallery 视频增加懒加载策略

### P2

- [ ] 增加 Case Study 模块
- [ ] 整理 Gallery 资源来源、上传、命名和 CDN 路径文档
- [ ] 如果需要 SEO/社媒预览，可补充 Gallery 专用静态图

---

## 四、代码验证记录

### 已核对文件

- `components/nanabananvideo/Gallery.tsx`
- `components/nanabananvideo/gallery/VideoCard.tsx`
- `components/nanabananvideo/index.tsx`
- `components/nanabananvideo/Hero.tsx`
- `i18n/messages/en/NanoBananaVideo.json`
- `i18n/messages/zh/NanoBananaVideo.json`
- `i18n/messages/ja/NanoBananaVideo.json`

### 验证结论

- Gallery 不是未开始，而是已经上线到当前产品页
- 文案、CDN 视频、首页集成都已落地
- 剩余工作主要是性能、导航入口、缩略图体系和扩展展示，而不是从零开发
