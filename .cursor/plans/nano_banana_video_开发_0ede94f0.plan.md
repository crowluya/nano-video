---
name: Nano Banana Video 开发
overview: 基于现有 nexty.dev 模板，接入 kie.ai API 实现文生图（Nano Banana/Midjourney/Flux/GPT-4o）和图生视频（Sora 2/Veo 3.1）功能，构建混合模式的正式产品，包含一体化工作流页面和独立功能页面。
todos:
  - id: kie-types
    content: 创建 lib/kie/types.ts 定义所有 kie.ai API 类型
    status: pending
  - id: kie-client
    content: 创建 lib/kie/client.ts 实现统一客户端
    status: pending
    dependencies:
      - kie-types
  - id: models-config
    content: 更新 config/models.ts 添加 kie.ai 模型配置
    status: pending
  - id: api-image
    content: 创建 /api/kie/image 图像生成路由
    status: pending
    dependencies:
      - kie-client
  - id: api-video
    content: 创建 /api/kie/video 视频生成路由
    status: pending
    dependencies:
      - kie-client
  - id: api-status
    content: 创建 /api/kie/status 和 /api/kie/upload 路由
    status: pending
    dependencies:
      - kie-client
  - id: components
    content: "创建前端组件: PromptGenerator, ImageGenerator, VideoGenerator"
    status: pending
    dependencies:
      - api-image
      - api-video
  - id: workflow-page
    content: 创建一体化工作流页面
    status: pending
    dependencies:
      - components
  - id: standalone-pages
    content: 创建独立功能页面 (image-gen, video-gen)
    status: pending
    dependencies:
      - components
  - id: site-config
    content: 更新站点配置和品牌 (site.ts, 首页)
    status: pending
  - id: credits-pricing
    content: 配置积分定价和消耗逻辑
    status: pending
    dependencies:
      - api-image
      - api-video
---

# Nano Banana Video 网站开发计划

## 一、架构概览

```mermaid
flowchart TB
    subgraph Frontend[前端页面]
        WorkflowPage[一体化工作流页面]
        ChatPage[AI Prompt 助手页]
        ImagePage[图像生成页]
        VideoPage[视频生成页]
    end
    
    subgraph API[API 路由层]
        ChatAPI["/api/ai-demo/single-chat"]
        ImageAPI["/api/kie/image"]
        VideoAPI["/api/kie/video"]
        StatusAPI["/api/kie/status"]
        UploadAPI["/api/kie/upload"]
    end
    
    subgraph Providers[外部服务]
        OpenRouter[OpenRouter LLM]
        KieAI[kie.ai API]
    end
    
    subgraph Core[核心模块]
        KieClient["lib/kie/client.ts"]
        CreditMgr["lib/payments/credit-manager.ts"]
    end
    
    WorkflowPage --> ChatAPI --> OpenRouter
    WorkflowPage --> ImageAPI --> KieClient --> KieAI
    WorkflowPage --> VideoAPI --> KieClient
    ImagePage --> ImageAPI
    VideoPage --> VideoAPI
    ImageAPI --> CreditMgr
    VideoAPI --> CreditMgr
```

## 二、开发任务

### Phase 1: kie.ai 基础设施 (核心)

1. **创建 kie.ai 客户端**

   - [`lib/kie/types.ts`](lib/kie/types.ts) - API 请求/响应类型定义
   - [`lib/kie/client.ts`](lib/kie/client.ts) - 统一客户端，封装所有 kie.ai API 调用
   - 支持：任务创建、状态轮询、文件上传

2. **更新模型配置**

   - [`config/models.ts`](config/models.ts) - 添加 kie.ai 模型定义
     - 图像：Nano Banana、Midjourney、Flux Kontext、GPT-4o Image
     - 视频：Sora 2、Veo 3.1

3. **环境变量**

   - 添加 `KIE_API_KEY` 到 `.env.local`

### Phase 2: API 路由开发

4. **图像生成 API**

   - `app/api/kie/image/route.ts` - 统一图像生成入口
   - 支持 text-to-image 和 image-to-image
   - 集成积分扣除逻辑

5. **视频生成 API**

   - `app/api/kie/video/route.ts` - 统一视频生成入口
   - 支持 Sora 2 和 Veo 3.1
   - Veo 3.1 支持首尾帧模式

6. **状态查询 API**

   - `app/api/kie/status/route.ts` - 任务状态轮询
   - `app/api/kie/upload/route.ts` - 图片上传到 kie.ai

### Phase 3: 前端组件开发

7. **一体化工作流页面**

   - `app/[locale]/(protected)/dashboard/workflow/page.tsx`
   - 三步向导：Prompt生成 → 图像生成 → 视频生成
   - 每步结果可传递到下一步

8. **独立功能组件**

   - `components/kie/PromptGenerator.tsx` - AI Prompt 生成器
   - `components/kie/ImageGenerator.tsx` - 图像生成组件（支持多模型）
   - `components/kie/VideoGenerator.tsx` - 视频生成组件
   - `components/kie/TaskStatus.tsx` - 任务状态显示/轮询

9. **独立功能页面**

   - `app/[locale]/(protected)/dashboard/image-gen/page.tsx`
   - `app/[locale]/(protected)/dashboard/video-gen/page.tsx`

### Phase 4: 产品化配置

10. **品牌与站点配置**

    - [`config/site.ts`](config/site.ts) - 更新网站名称为 "Nano Banana Video"
    - 更新 Logo、Favicon、OG 图片

11. **积分定价**

    - 在 Dashboard `/dashboard/prices` 配置各操作积分消耗
    - 建议：聊天 1积分/次，图像 5-20积分/张，视频 50-200积分/个

12. **首页和导航**

    - 更新首页 Hero/Features 描述产品功能
    - 更新侧边栏导航菜单

## 三、关键模型配置参考

| 模型 | 类型 | 端点 | 特殊参数 |

|------|------|------|----------|

| Nano Banana | 文生图 | `/jobs/createTask` | image_size, output_format |

| Midjourney | 文生图 | `/mj/generate` | version, speed, aspectRatio |

| Flux Kontext | 文生图 | `/flux/kontext/generate` | model (pro/max), aspectRatio |

| GPT-4o Image | 文生图 | `/gpt4o-image/generate` | size, nVariants |

| Sora 2 | 图生视频 | `/jobs/createTask` | aspect_ratio, n_frames (10/15) |

| Veo 3.1 | 图生视频 | `/veo/generate` | generationType, aspectRatio |

## 四、工作流数据流

```mermaid
sequenceDiagram
    participant User
    participant Chat as AI Chat
    participant Image as Image API
    participant Video as Video API
    participant Kie as kie.ai
    
    User->>Chat: 描述创意想法
    Chat-->>User: 返回优化的图像 Prompt
    
    User->>Image: 使用 Prompt 生成图像
    Image->>Kie: createTask (Nano Banana/MJ)
    Kie-->>Image: taskId
    Image-->>User: 轮询直到完成，返回图像URL
    
    User->>Video: 选择图像 + 动作描述
    Video->>Kie: createTask (Sora2/Veo3)
    Kie-->>Video: taskId
    Video-->>User: 轮询直到完成，返回视频URL
```

## 五、预估工作量

| 阶段 | 任务 | 预估时间 |

|------|------|----------|

| Phase 1 | kie.ai 基础设施 | 2-3 小时 |

| Phase 2 | API 路由开发 | 2-3 小时 |

| Phase 3 | 前端组件开发 | 4-5 小时 |

| Phase 4 | 产品化配置 | 1-2 小时 |

**总计约 10-13 小时开发时间**