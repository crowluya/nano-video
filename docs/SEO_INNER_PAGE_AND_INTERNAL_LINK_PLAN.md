# Nano Banana Video 内页与内链规划

> 创建日期：2026-03-13
> 数据来源：`keyword-data-nano-banana-video-all.csv`
> 适用范围：当前 `nano-video` 项目站点信息架构、SEO 内页规划、站内内链规划

---

## 1. 背景

当前项目已经具备以下基础：

- 首页路由：`app/[locale]/(basic-layout)/page.tsx`
- 品牌页：`app/[locale]/(basic-layout)/nanabananvideo/page.tsx`
- 工具页：`/video-generation`
- Prompt 工具页：`/prompt-generator`
- 博客页：`/blog`
- 多语言元数据能力：`lib/metadata.ts`
- 内容型 MDX 能力：参考 `app/[locale]/(basic-layout)/about/page.tsx`

当前问题不是“缺一个首页”，而是“缺一组清晰的专题内页和站内分发结构”。

基于当前项目代码，产品边界需要统一按以下事实表达：

- 页面和工具可以在未登录状态下预览
- 视频生成和 Prompt Generator 真正提交使用都需要登录
- 新用户注册后会获得试用 credits
- 因此文案统一使用：
  - `Free to try after sign up`
  - `Preview available without login`

关键词表显示需求高度集中在这些意图簇：

- 品牌总词：`nano banana video`、`nano banana video generator`
- 功能词：`image to video`、`text to video`
- 转化词：`free`、`online`
- 内容词：`prompt`
- 问题词：`limit`、`length`、`pricing`、`resolution`
- 决策词：`vs sora`、`vs veo`

因此不建议做大量散页，而是做少量高质量专题页。

---

## 2. 站内层级

简单版站内层级如下：

```text
L1：首页
/
│
├─ L2：核心专题页
│  ├─ /nano-banana-image-to-video
│  ├─ /nano-banana-text-to-video
│  ├─ /can-nano-banana-make-videos
│  ├─ /nano-banana-video-prompts
│
└─ L3：工具页 / 指南页 / 博客页
   ├─ 工具页
   │  └─ /prompt-generator  复用首页的 prompt-generator 组件
   │
   ├─ 指南页
   │  ├─ /guides/how-to-make-videos-with-nano-banana
   │  ├─ /guides/best-nano-banana-video-prompts
   │  └─ /guides/nano-banana-video-settings-and-limits
   │
   └─ 博客页
      ├─ /blog
      └─ /blog/[slug]
```

说明：

- `L1 首页` 负责分发权重和流量。
- `L2 核心专题页` 是 SEO 主战场。
- `L3 工具页` 承担转化。
- `L3 指南页` 承接长尾问题词。
- `L3 博客页` 承接资讯、案例和弱商业内容。

---

## 3. 核心专题页规划

### 3.1 `/nano-banana-video-generator`

- 页面角色：品牌主词页、核心转化专题页
- 主关键词：
  - `nano banana video`
  - `nano banana video generator`
  - `nano banana ai video`
  - `nano banana video generation`
- 次关键词：
  - `nano banana ai video generator`
  - `nano banana video ai`
  - `nano banana create video`
  - `nano banana videos`
  - `nano banana video maker`
  - `nano banana video creator`
- 不主打：
  - `free`
  - `image to video`
  - `text to video`
  - `prompt`
  - `pricing/limit`

### 3.2 `/nano-banana-image-to-video`

- 页面角色：图片转视频专题页
- 主关键词：
  - `nano banana image to video`
  - `nano banana pro image to video`
  - `image to video nano banana`
- 次关键词：
  - `nano banana photo to video`
  - `nano banana video from image`
  - `free nano banana image to video`
  - `nano banana image to video google`
- 不主打：
  - `text to video`
  - `pricing`
  - `vs sora`

### 3.3 `/nano-banana-text-to-video`

- 页面角色：文本生成视频专题页
- 主关键词：
  - `nano banana text to video`
  - `text to video ai nano banana`
- 次关键词：
  - `text to video ai free nano banana`
  - `create ai video nano banana`
  - `generate video nano banana`
  - `can nano banana generate video`
- 不主打：
  - `image to video`
  - `pricing/limit`

### 3.4 `/nano-banana-video-free`

- 页面角色：免费试用和在线使用专题页
- 主关键词：
  - `nano banana ai video generator free`
  - `nano banana video generator free`
  - `nano banana video free`
- 次关键词：
  - `nano banana video maker free`
  - `nano banana video generation free`
  - `nano banana video online free`
  - `nano banana video ai free`
  - `generate video nano banana free`
  - `ai video generator free nano banana`
- 不主打：
  - 深度教程
  - 复杂模型对比

### 3.5 `/nano-banana-video-prompts`

- 页面角色：Prompt 模板和示例页
- 主关键词：
  - `nano banana video prompt`
  - `nano banana video generation prompt`
  - `nano banana video prompts examples`
- 次关键词：
  - `nano banana pro video prompts`
  - `prompt ideas for nano banana video`
  - `prompts for generating ultrarealistic videos nano banana`
  - `nano banana video car prompt`
- 不主打：
  - 价格
  - 限制
  - 决策比较

### 3.6 `/nano-banana-video-pricing-limits`

- 页面角色：价格、额度、时长、参数说明页
- 主关键词：
  - `nano banana pro video limit`
  - `nano banana video generator limit`
  - `nano banana video length`
  - `nano banana video pricing`
- 次关键词：
  - `nano banana video pro pricing`
  - `how much credit does it take to generate a video with nano banana`
  - `nano banana video resolution`
  - `nano banana video quality`
  - `nano banana video settings`
  - `nano banana video size`
- 不主打：
  - Prompt 内容
  - 通用教程

### 3.7 `/nano-banana-vs-sora-vs-veo`

- 页面角色：对比决策页
- 主关键词：
  - `best video ai generator nano banana or sora`
- 次关键词：
  - `veo 3 sora 2 o nano banana para creacion de videos`
  - `which ai video creation includes nano banana and sora`
  - `sora 2, higgsfield, veo 3, kling, nano banana which of these has free video generator`
- 不主打：
  - 免费试用词为主
  - 教程型词为主

---

## 4. 内链结构图

```text
首页 /
├─ /video-generation
├─ /prompt-generator
├─ /blog
├─ /nano-banana-video-generator
├─ /nano-banana-image-to-video
├─ /nano-banana-text-to-video
├─ /nano-banana-video-free
├─ /nano-banana-video-prompts
└─ /nano-banana-video-pricing-limits

/nano-banana-video-generator
├─ /video-generation
├─ /nano-banana-image-to-video
├─ /nano-banana-text-to-video
├─ /nano-banana-video-free
├─ /nano-banana-video-prompts
├─ /nano-banana-video-pricing-limits
└─ /nano-banana-vs-sora-vs-veo

/nano-banana-image-to-video
├─ /video-generation
├─ /nano-banana-video-generator
├─ /nano-banana-video-prompts
├─ /nano-banana-video-free
└─ /guides/how-to-make-videos-with-nano-banana

/nano-banana-text-to-video
├─ /video-generation
├─ /nano-banana-video-generator
├─ /nano-banana-video-prompts
├─ /nano-banana-video-free
└─ /guides/how-to-make-videos-with-nano-banana

/nano-banana-video-free
├─ /video-generation
├─ /nano-banana-video-generator
├─ /nano-banana-video-pricing-limits
└─ /nano-banana-video-prompts

/nano-banana-video-prompts
├─ /prompt-generator
├─ /video-generation
├─ /nano-banana-image-to-video
├─ /nano-banana-text-to-video
└─ /nano-banana-video-generator

/nano-banana-video-pricing-limits
├─ /video-generation
├─ /nano-banana-video-generator
├─ /nano-banana-video-free
└─ /nano-banana-vs-sora-vs-veo

/nano-banana-vs-sora-vs-veo
├─ /nano-banana-video-generator
├─ /nano-banana-image-to-video
├─ /nano-banana-text-to-video
├─ /nano-banana-video-free
└─ /video-generation

/guides/how-to-make-videos-with-nano-banana
├─ /nano-banana-video-generator
├─ /nano-banana-video-prompts
├─ /video-generation
└─ /blog
```

---

## 5. 内链规则

### 5.1 首页

首页不是只做滚动展示，还要承担全站分发能力。

首页需要固定露出这些链接：

- `Nano Banana Video Generator`
- `Nano Banana Image to Video`
- `Nano Banana Text to Video`
- `Nano Banana Video Free`
- `Nano Banana Video Prompts`
- `Nano Banana Pricing & Limits`

建议露出位置：

- Hero 下方增加专题入口区块
- FAQ 上方增加 `Explore More Pages`
- Footer 的 `Products` 区增加专题页链接

### 5.2 核心专题页

每个核心专题页都要满足：

- 至少回链首页 1 次
- 至少链接 2 个相关专题页
- 至少链接 1 个工具页
- 至少有 1 个 CTA 指向真实功能页

### 5.3 工具页

现有工具页：

- `/video-generation`
- `/prompt-generator`

工具页建议增加 `Related Pages` 区块，反向链接到：

- `video-generator`
- `image-to-video`
- `text-to-video`
- `video-prompts`
- `pricing-limits`

### 5.4 指南页和博客页

每篇指南或博客内容都建议固定包含：

- 一个指向对应专题页的主链接
- 一个指向对应工具页的 CTA 链接
- 1 到 2 个相关指南或专题页推荐

避免博客成为站内孤岛。

---

## 6. 锚文本策略

### 6.1 精确锚文本

每页少量使用，避免全站过度重复：

- `nano banana video generator`
- `nano banana image to video`
- `nano banana text to video`
- `nano banana video prompts`

### 6.2 变体锚文本

优先多用自然变体：

- `create videos from nano banana images`
- `free nano banana video tool`
- `best prompts for nano banana videos`
- `nano banana video pricing and limits`
- `turn text into nano banana videos`

### 6.3 CTA 锚文本

直接服务转化：

- `try the video generator`
- `open the prompt generator`
- `start creating videos`
- `generate a video now`

---

## 7. 页面模板建议

### 7.1 转化型专题页模板

适用于：

- `video-generator`
- `image-to-video`
- `text-to-video`
- `video-free`

模块建议：

1. Hero
2. Demo 或 Tool Preview
3. Example Output Gallery
4. How It Works
5. Why Choose This Page
6. Use Cases
7. FAQ
8. CTA

### 7.2 支持型专题页模板

适用于：

- `pricing-limits`
- `vs-sora-vs-veo`

模块建议：

1. 问题定义
2. 表格或结构化对比
3. 能力边界
4. 常见限制
5. FAQ
6. CTA

### 7.3 指南页模板

适用于：

- `how-to`
- `prompt examples`
- `settings and limits`

模块建议：

1. 步骤教程
2. 示例 Prompt
3. 常见错误
4. 最佳实践
5. 相关页面推荐
6. CTA

---

## 8. 当前项目里的落地方式

### 8.1 固定专题页

建议放在：

```text
app/[locale]/(basic-layout)/
  ├── nano-banana-video-generator/
  ├── nano-banana-image-to-video/
  ├── nano-banana-text-to-video/
  ├── nano-banana-video-free/
  ├── nano-banana-video-prompts/
  ├── nano-banana-video-pricing-limits/
  └── nano-banana-vs-sora-vs-veo/
```

### 8.2 指南页

建议走 MDX：

```text
content/guides/
  ├── how-to-make-videos-with-nano-banana/
  ├── best-nano-banana-video-prompts/
  └── nano-banana-video-settings-and-limits/
```

### 8.3 组件复用

建议优先复用：

- `components/nanabananvideo/*`
- `components/video-generation/*`
- `components/prompt-generator/*`

避免每个专题页都新造一套 UI。

### 8.4 sitemap

后续必须把固定专题页加入：

- `app/sitemap.ts`

否则页面即使上线，也不利于系统收录。

---

## 9. 实施优先级

### P0

- `/nano-banana-video-generator`
- `/nano-banana-image-to-video`
- `/nano-banana-text-to-video`
- `/nano-banana-video-free`
- `/nano-banana-video-prompts`
- `/nano-banana-video-pricing-limits`

### P1

- `/nano-banana-vs-sora-vs-veo`
- `/guides/how-to-make-videos-with-nano-banana`

### P2

- `/use-cases/product-videos-with-nano-banana`
- `/use-cases/ugc-video-ads-with-nano-banana`
- `/use-cases/animated-videos-with-nano-banana`

---

## 10. 下一步建议

后续建议按这个顺序继续推进：

1. 先定 6 个 P0 页面各自的 `Title / H1 / Meta Description`
2. 再定每个页面的模块结构和主 CTA
3. 再补 Header、Footer、工具页底部的 `Related Pages`
4. 最后补 `sitemap` 和多语言扩展

这份文档先作为第一版基线，后续可以继续补页面级 PRD。

---

## 11. P0 页面级执行稿

本节用于指导第一批核心页面上线，优先保证：

- 页面意图清晰
- 页面之间不抢词
- 每个页面都能把用户导向真实工具页

### 11.1 `/nano-banana-video-generator`

#### 页面角色

- 全站主品牌词 SEO 页
- 首页之外最核心的商业专题页
- 负责覆盖品牌总词和通用生成词

#### 关键词范围

- 主关键词：
  - `nano banana video`
  - `nano banana video generator`
  - `nano banana ai video`
  - `nano banana video generation`
- 次关键词：
  - `nano banana ai video generator`
  - `nano banana video ai`
  - `nano banana create video`
  - `nano banana videos`
  - `nano banana video maker`

#### 建议 Title

`Nano Banana Video Generator - Create AI Videos Online`

#### 建议 H1

`Nano Banana Video Generator`

#### 建议 Meta Description

`Create AI videos with Nano Banana using text-to-video and image-to-video workflows. Preview the workflow without login, then sign up to start your free trial credits and generate watermark-free videos.`

#### 页面模块

1. Hero
2. 生成器能力总览
3. Video Demo 或工具预览
4. Image to Video 和 Text to Video 双入口
5. Why Use Nano Banana for Video
6. Use Cases
7. FAQ
8. CTA

#### FAQ 建议

- What is Nano Banana video generator?
- Can Nano Banana create videos from text and images?
- Is Nano Banana video generator free to try after sign up?
- How long does Nano Banana video generation take?
- What is the difference between Nano Banana video and image tools?

#### 内链目标

- 指向：
  - `/video-generation`
  - `/nano-banana-image-to-video`
  - `/nano-banana-text-to-video`
  - `/nano-banana-video-free`
  - `/nano-banana-video-prompts`
  - `/nano-banana-video-pricing-limits`

---

### 11.2 `/nano-banana-image-to-video`

#### 页面角色

- 图片转视频功能专题页
- 承接最明确的上传图片生成视频意图

#### 关键词范围

- 主关键词：
  - `nano banana image to video`
  - `nano banana pro image to video`
  - `image to video nano banana`
- 次关键词：
  - `nano banana photo to video`
  - `nano banana video from image`
  - `free nano banana image to video`
  - `nano banana image to video google`

#### 建议 Title

`Nano Banana Image to Video - Turn Images Into AI Videos`

#### 建议 H1

`Nano Banana Image to Video`

#### 建议 Meta Description

`Turn Nano Banana images into AI videos online. Preview the workflow without login, then sign up to use trial credits, add motion prompts, and generate watermark-free videos.`

#### 页面模块

1. Hero
2. Upload Image to Video Flow
3. Demo Gallery
4. Best Image Types for Video Generation
5. Example Motion Prompts
6. FAQ
7. CTA

#### FAQ 建议

- How does Nano Banana image to video work?
- What kind of images work best?
- Can I turn product photos into videos?
- Is Nano Banana image to video free after sign up?
- How is image to video different from text to video?

#### 内链目标

- 指向：
  - `/video-generation`
  - `/nano-banana-video-generator`
  - `/nano-banana-video-prompts`
  - `/nano-banana-video-free`
  - `/guides/how-to-make-videos-with-nano-banana`

---

### 11.3 `/nano-banana-text-to-video`

#### 页面角色

- 文本生成视频功能专题页
- 适合承接 prompt 直接出视频的需求

#### 关键词范围

- 主关键词：
  - `nano banana text to video`
  - `text to video ai nano banana`
- 次关键词：
  - `text to video ai free nano banana`
  - `create ai video nano banana`
  - `generate video nano banana`
  - `can nano banana generate video`

#### 建议 Title

`Nano Banana Text to Video - Generate AI Videos From Prompts`

#### 建议 H1

`Nano Banana Text to Video`

#### 建议 Meta Description

`Generate AI videos from text prompts with Nano Banana. Preview the workflow without login, then sign up to use trial credits, choose a model, and create videos online.`

#### 页面模块

1. Hero
2. Text to Video Workflow
3. Prompt Examples
4. Camera Motion and Scene Tips
5. Sample Outputs
6. FAQ
7. CTA

#### FAQ 建议

- Can Nano Banana generate videos from text?
- What prompts work best for text to video?
- Is Nano Banana text to video free after sign up?
- How detailed should a video prompt be?
- Can I use Nano Banana text to video for ads or social content?

#### 内链目标

- 指向：
  - `/video-generation`
  - `/nano-banana-video-generator`
  - `/nano-banana-video-prompts`
  - `/nano-banana-video-free`
  - `/guides/how-to-make-videos-with-nano-banana`

---

### 11.4 `/nano-banana-video-free`

#### 页面角色

- 免费试用专题页
- 承接 `free`、`online free`、`no watermark` 等高转化词

#### 关键词范围

- 主关键词：
  - `nano banana ai video generator free`
  - `nano banana video generator free`
  - `nano banana video free`
- 次关键词：
  - `nano banana video maker free`
  - `nano banana video generation free`
  - `nano banana video online free`
  - `nano banana video ai free`
  - `generate video nano banana free`

#### 建议 Title

`Nano Banana Video Free - Free AI Video Generator Online`

#### 建议 H1

`Nano Banana Video Free`

#### 建议 Meta Description

`Try Nano Banana video generation online with preview access before login. Sign up to unlock trial credits, create AI videos from text and images, and export watermark-free results.`

#### 页面模块

1. Hero
2. What You Can Do for Free
3. No Watermark / Online / Fast Highlights
4. Free Use Cases
5. Upgrade Path and Limits Overview
6. FAQ
7. CTA

#### FAQ 建议

- Is Nano Banana video free after sign up?
- Can I preview Nano Banana video without login?
- Can I use Nano Banana online without installing anything?
- Are free videos watermark-free?
- What are the limits of the free plan?
- When should I upgrade from free usage?

#### 内链目标

- 指向：
  - `/video-generation`
  - `/nano-banana-video-generator`
  - `/nano-banana-video-pricing-limits`
  - `/nano-banana-video-prompts`

---

### 11.5 `/nano-banana-video-prompts`

#### 页面角色

- Prompt 教程和模板页
- 与 `/prompt-generator` 形成内容页 + 工具页组合

#### 关键词范围

- 主关键词：
  - `nano banana video prompt`
  - `nano banana video generation prompt`
  - `nano banana video prompts examples`
- 次关键词：
  - `nano banana pro video prompts`
  - `prompt ideas for nano banana video`
  - `prompts for generating ultrarealistic videos nano banana`
  - `nano banana video car prompt`

#### 建议 Title

`Nano Banana Video Prompts - Best Prompt Examples for AI Videos`

#### 建议 H1

`Nano Banana Video Prompts`

#### 建议 Meta Description

`Explore the best Nano Banana video prompts for text-to-video and image-to-video workflows. Use examples, templates, and prompt patterns to generate better videos.`

#### 页面模块

1. Hero
2. Prompt Formula
3. Prompt Examples by Use Case
4. Good vs Bad Prompt Comparisons
5. Link to Prompt Generator Tool
6. FAQ
7. CTA

#### FAQ 建议

- What are the best Nano Banana video prompts?
- How do I write better prompts for AI video generation?
- Should prompts be short or detailed?
- Can I use prompts for both text to video and image to video?
- Is there a Nano Banana prompt generator?

#### 内链目标

- 指向：
  - `/prompt-generator`
  - `/video-generation`
  - `/nano-banana-image-to-video`
  - `/nano-banana-text-to-video`
  - `/nano-banana-video-generator`

---

### 11.6 `/nano-banana-video-pricing-limits`

#### 页面角色

- 价格、额度、时长、清晰度、参数说明页
- 为 `pricing`、`limit`、`length`、`credits` 提供统一承接

#### 关键词范围

- 主关键词：
  - `nano banana pro video limit`
  - `nano banana video generator limit`
  - `nano banana video length`
  - `nano banana video pricing`
- 次关键词：
  - `nano banana video pro pricing`
  - `how much credit does it take to generate a video with nano banana`
  - `nano banana video resolution`
  - `nano banana video quality`
  - `nano banana video settings`
  - `nano banana video size`

#### 建议 Title

`Nano Banana Video Pricing and Limits - Credits, Length, Quality`

#### 建议 H1

`Nano Banana Video Pricing and Limits`

#### 建议 Meta Description

`Learn Nano Banana video pricing, credit usage, video length limits, quality options, and generation settings. Understand what you can preview without login, what trial credits cover after sign up, and what requires paid usage.`

#### 页面模块

1. Hero
2. Pricing Overview
3. Credit Usage and Limits Table
4. Video Length / Resolution / Settings Explanation
5. Free vs Paid Comparison
6. FAQ
7. CTA

#### FAQ 建议

- How much does Nano Banana video cost?
- What is the Nano Banana video length limit?
- How many credits does one video generation use?
- What resolution does Nano Banana support?
- What settings affect output quality?

#### 内链目标

- 指向：
  - `/video-generation`
  - `/nano-banana-video-generator`
  - `/nano-banana-video-free`
  - `/nano-banana-vs-sora-vs-veo`

---

## 12. 首页与 P0 页面分工建议

为了避免首页和专题页互相抢词，建议这样分工：

### 首页

- 角色：品牌首页和流量分发中心
- 重点：
  - 展示核心价值
  - 引导进入生成器
  - 分发到各专题页

首页可以覆盖品牌核心词，但不要把所有问题词都塞在首页里。

首页和专题页里与“免费”相关的描述，需要统一采用：

- `Free to try after sign up`
- `Preview available without login`

避免写成“匿名即可直接生成”，因为这与当前代码行为不一致。

### P0 专题页

- 角色：针对单一搜索意图做深度承接
- 重点：
  - 页面标题清晰
  - FAQ 和模块只服务一个意图
  - 页面内链把用户推向工具页和相关页

---

## 13. 推荐上线顺序

### 第一批

1. `/nano-banana-video-generator`
2. `/nano-banana-image-to-video`
3. `/nano-banana-text-to-video`

原因：

- 这三页最容易直接承接高意图搜索
- 可以最大化复用现有组件
- 与现有 `/video-generation` 工具页关系最清晰

### 第二批

4. `/nano-banana-video-free`
5. `/nano-banana-video-prompts`
6. `/nano-banana-video-pricing-limits`

原因：

- 属于问题词和转化词承接页
- 可以放在第一批页面的相关链接区块中逐步加权

### 第三批

7. `/nano-banana-vs-sora-vs-veo`
8. `/guides/how-to-make-videos-with-nano-banana`

原因：

- 比较词和教程词更适合作为补充层
- 适合在前六页上线后再继续扩展

---

## 14. 基于当前结构的内链模块设计

本节按当前确认的结构设计：

```text
L1：首页
/

L2：核心专题页
  /nano-banana-image-to-video
  /nano-banana-text-to-video
  /can-nano-banana-make-videos
  /nano-banana-video-prompts

L3：工具页 / 指南页 / 博客页
  工具页
    /prompt-generator

  指南页
    /guides/how-to-make-videos-with-nano-banana
    /guides/best-nano-banana-video-prompts
    /guides/nano-banana-video-settings-and-limits

  博客页
    /blog
    /blog/[slug]
```

目标是：

- 首页负责分发
- L2 负责承接搜索意图
- L3 负责转化和长尾补充
- L3 再把权重回传给 L2

在这套结构里，所有页面涉及试用门槛时都遵循同一表达：

- 未登录：可浏览、可预览
- 已注册登录：可使用试用 credits 开始生成
- Prompt Generator：未登录可看界面，提交消息需登录

---

### 14.1 首页 `/`

首页建议放 4 个内链模块。

#### 模块 A：Hero 下方

标题建议：

- `Explore Nano Banana Video Workflows`

链接：

- `/nano-banana-image-to-video`
- `/nano-banana-text-to-video`
- `/can-nano-banana-make-videos`
- `/nano-banana-video-prompts`

#### 模块 B：功能介绍区

标题建议：

- `Choose Your Starting Point`

链接方向：

- image workflow → `/nano-banana-image-to-video`
- text workflow → `/nano-banana-text-to-video`
- prompts → `/nano-banana-video-prompts`

#### 模块 C：中下部指南区

标题建议：

- `Popular Guides`

链接：

- `/guides/how-to-make-videos-with-nano-banana`
- `/guides/best-nano-banana-video-prompts`
- `/guides/nano-banana-video-settings-and-limits`

#### 模块 D：底部转化区

标题建议：

- `Start With the Prompt Generator`

链接：

- 主 CTA → `/prompt-generator`
- 次链接 → `/blog`

#### 首页推荐锚文本

- `nano banana image to video`
- `nano banana text to video`
- `can nano banana make videos`
- `nano banana video prompts`
- `try the prompt generator`

---

### 14.2 `/nano-banana-image-to-video`

建议放 5 个内链模块。

#### 模块 A：首屏副文案

链接：

- `/prompt-generator`

锚文本建议：

- `generate your first image-to-video prompt`

#### 模块 B：相关功能区

标题建议：

- `Also Need Text to Video?`

链接：

- `/nano-banana-text-to-video`

锚文本建议：

- `nano banana text to video`

#### 模块 C：Prompt 帮助区

链接：

- `/nano-banana-video-prompts`

锚文本建议：

- `best prompts for nano banana videos`

#### 模块 D：帮助区

标题建议：

- `Learn More`

链接：

- `/guides/how-to-make-videos-with-nano-banana`
- `/guides/nano-banana-video-settings-and-limits`

#### 模块 E：底部相关推荐

标题建议：

- `Related Pages`

链接：

- `/can-nano-banana-make-videos`
- `/nano-banana-text-to-video`
- `/nano-banana-video-prompts`

#### 推荐锚文本

- `turn nano banana images into videos`
- `nano banana text to video`
- `video prompt examples`
- `video settings and limits`
- `can nano banana make videos`

---

### 14.3 `/nano-banana-text-to-video`

建议放 5 个内链模块。

#### 模块 A：首屏 CTA

链接：

- `/prompt-generator`

锚文本建议：

- `start with the prompt generator`

#### 模块 B：Prompt 公式区

链接：

- `/nano-banana-video-prompts`

锚文本建议：

- `nano banana video prompt examples`

#### 模块 C：相关能力区

链接：

- `/nano-banana-image-to-video`

锚文本建议：

- `switch to image to video`

#### 模块 D：教程区

链接：

- `/guides/best-nano-banana-video-prompts`
- `/guides/how-to-make-videos-with-nano-banana`

#### 模块 E：底部相关推荐

标题建议：

- `Related Pages`

链接：

- `/can-nano-banana-make-videos`
- `/nano-banana-image-to-video`
- `/nano-banana-video-prompts`

#### 推荐锚文本

- `generate videos from text prompts`
- `nano banana video prompts`
- `best nano banana video prompts`
- `how to make videos with nano banana`

---

### 14.4 `/can-nano-banana-make-videos`

这是认知词到产品词的桥梁页，建议放 6 个内链模块。

#### 模块 A：结论区

链接：

- `/prompt-generator`

锚文本建议：

- `yes, try making a video now`

#### 模块 B：能力拆分区

标题建议：

- `How Nano Banana Can Make Videos`

链接：

- `/nano-banana-image-to-video`
- `/nano-banana-text-to-video`

#### 模块 C：Prompt 支持区

链接：

- `/nano-banana-video-prompts`

锚文本建议：

- `use better nano banana video prompts`

#### 模块 D：教程区

链接：

- `/guides/how-to-make-videos-with-nano-banana`

#### 模块 E：设置说明区

链接：

- `/guides/nano-banana-video-settings-and-limits`

#### 模块 F：底部相关推荐

标题建议：

- `Related Pages`

链接：

- `/nano-banana-image-to-video`
- `/nano-banana-text-to-video`
- `/nano-banana-video-prompts`

#### 推荐锚文本

- `can nano banana make videos`
- `nano banana image to video`
- `nano banana text to video`
- `how to make videos with nano banana`
- `video settings and limits`

---

### 14.5 `/nano-banana-video-prompts`

这个页需要把最多权重导向 `/prompt-generator`，建议放 5 个内链模块。

#### 模块 A：首屏 CTA

链接：

- `/prompt-generator`

锚文本建议：

- `open the prompt generator`

#### 模块 B：Prompt 分类区

链接：

- `/nano-banana-text-to-video`
- `/nano-banana-image-to-video`

锚文本建议：

- `prompts for text to video`
- `prompts for image to video`

#### 模块 C：认知补充区

链接：

- `/can-nano-banana-make-videos`

锚文本建议：

- `see what nano banana can do`

#### 模块 D：延伸阅读区

链接：

- `/guides/best-nano-banana-video-prompts`
- `/guides/how-to-make-videos-with-nano-banana`

#### 模块 E：底部相关推荐

标题建议：

- `Related Pages`

链接：

- `/nano-banana-text-to-video`
- `/nano-banana-image-to-video`
- `/can-nano-banana-make-videos`

#### 推荐锚文本

- `nano banana video prompts`
- `best prompt examples`
- `text to video prompts`
- `image to video prompts`
- `try the prompt generator`

---

### 14.6 `/prompt-generator`

这是工具页，不是 SEO 主承接页，但必须回链 L2。

建议放 3 个内链模块。

#### 模块 A：工具区下方

标题建议：

- `Learn Before You Generate`

链接：

- `/nano-banana-video-prompts`
- `/nano-banana-text-to-video`
- `/nano-banana-image-to-video`
- `/can-nano-banana-make-videos`

#### 模块 B：FAQ 下方

标题建议：

- `Useful Guides`

链接：

- `/guides/best-nano-banana-video-prompts`
- `/guides/how-to-make-videos-with-nano-banana`

#### 模块 C：底部阅读区

标题建议：

- `Read More`

链接：

- `/blog`

#### 推荐锚文本

- `learn nano banana video prompts`
- `learn text to video`
- `learn image to video`
- `can nano banana make videos`

---

### 14.7 指南页模板

3 个 guide 建议统一固定 3 个内链模块。

#### 模块 A：开头导读

作用：

- 回链对应 L2 主专题页

#### 模块 B：正文中段

标题建议：

- `Use the Tool`

链接：

- `/prompt-generator`

#### 模块 C：底部相关推荐

标题建议：

- `Related Pages`

链接策略：

- 2 个 L2 页面
- 1 个 guide 页面

#### 指南页映射建议

`/guides/how-to-make-videos-with-nano-banana`

- 主回链：`/can-nano-banana-make-videos`
- 次链：`/nano-banana-text-to-video`
- CTA：`/prompt-generator`

`/guides/best-nano-banana-video-prompts`

- 主回链：`/nano-banana-video-prompts`
- 次链：`/nano-banana-text-to-video`
- CTA：`/prompt-generator`

`/guides/nano-banana-video-settings-and-limits`

- 主回链：`/can-nano-banana-make-videos`
- 次链：`/nano-banana-image-to-video`
- CTA：`/prompt-generator`

---

### 14.8 博客页模板

#### `/blog`

博客列表页建议增加顶部专题推荐区。

标题建议：

- `Recommended Pages`

链接：

- `/nano-banana-image-to-video`
- `/nano-banana-text-to-video`
- `/can-nano-banana-make-videos`
- `/nano-banana-video-prompts`

#### `/blog/[slug]`

每篇文章固定带 3 类链接：

- 1 个主专题页
- 1 个 CTA 到 `/prompt-generator`
- 2 个相关文章或指南

#### 博客主题映射规则

- 写 prompt 的文章 → 主专题页链接到 `/nano-banana-video-prompts`
- 写文字生成视频 → 主专题页链接到 `/nano-banana-text-to-video`
- 写图片生成视频 → 主专题页链接到 `/nano-banana-image-to-video`
- 写能力判断或评测 → 主专题页链接到 `/can-nano-banana-make-videos`

---

## 15. 最简执行规则

为了让站内页不变成孤页，后续所有页面都尽量满足以下规则：

- 首页至少链接到所有 L2 页面
- 每个 L2 页面至少链接到：
  - `1 个工具页`
  - `2 个 L2 页面`
  - `1 个指南页`
- 每个 guide 至少链接回：
  - `1 个 L2 页面`
  - `/prompt-generator`
- 每篇 blog 至少链接回：
  - `1 个 L2 页面`
  - `/prompt-generator`

这个规则的目的不是堆链接，而是保证：

- 站内权重能够从首页下沉
- 工具页不会只进不出
- 指南页和博客页不会成为孤岛
