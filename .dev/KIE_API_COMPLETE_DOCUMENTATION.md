# KIE.ai API 完整文档

> **项目**: Nano Banana Video  
> **生成时间**: 2026-02-10  
> **文档版本**: 1.0.0

---

## 📋 目录

1. [概述](#概述)
2. [API 基础信息](#api-基础信息)
3. [图片生成 API](#图片生成-api)
4. [视频生成 API](#视频生成-api)
5. [音乐生成 API](#音乐生成-api)
6. [文件上传 API](#文件上传-api)
7. [积分系统](#积分系统)
8. [项目集成](#项目集成)
9. [错误处理](#错误处理)
10. [参考链接](#参考链接)

---

## 概述

### KIE.ai 简介

KIE.ai 是一个统一的 AI 生成平台，提供图片、视频、音乐生成服务。本项目通过 KIE.ai API 集成了多个 AI 模型。

### 支持的功能

- **图片生成**: Nano Banana (Google Gemini), Midjourney, Flux Kontext, GPT-4o Image, Z-Image
- **视频生成**: Sora 2, Sora 2 Pro, Veo 3.1 Fast, Runway Gen-3, Luma Ray 2, Wan Video
- **音乐生成**: Suno V3.5 ~ V5
- **文件上传**: Base64 / URL 上传

---

## API 基础信息

### 端点 (Endpoints)

```
主 API: https://api.kie.ai
文件上传: https://kieai.redpandaai.co
```

### 认证 (Authentication)

```http
Authorization: Bearer YOUR_KIE_API_KEY
Content-Type: application/json
```

### 环境变量

```bash
KIE_API_KEY=your_api_key_here
```

### 响应格式

```typescript
interface KieApiResponse<T> {
  code: number;  // 200 = 成功
  msg: string;   // 错误信息或 "success"
  data: T;       // 响应数据
}
```

### 任务状态

```typescript
type TaskSuccessFlag = 0 | 1 | 2 | 3;
// 0 = 生成中
// 1 = 成功
// 2 = 创建任务失败
// 3 = 生成失败

type TaskState = 'pending' | 'processing' | 'success' | 'fail' | 'failed';
```

---

## 图片生成 API

### 1. Nano Banana (Google Gemini Image)

#### 模型列表

| 模型 ID | 名称 | 功能 | 积分 |
|---------|------|------|------|
| `google/nano-banana` | Nano Banana | 文生图 | 5 |
| `google/nano-banana-edit` | Nano Banana Edit | 文生图、图生图 | 8 |
| `nano-banana-pro` | Nano Banana Pro | 文生图、图生图、4K | 15 |

#### API 端点

```
POST /api/v1/jobs/createTask
```

#### 请求示例

```typescript
{
  model: "google/nano-banana",
  input: {
    prompt: "A beautiful sunset over mountains",
    aspect_ratio: "16:9",
    output_format: "png"
  }
}
```

#### 参数说明

```typescript
interface NanoBananaInput {
  prompt: string;                    // 提示词 (必填)
  aspect_ratio?: string;             // 宽高比: "1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "auto"
  output_format?: "png" | "jpg";     // 输出格式
  resolution?: "1K" | "2K" | "4K";   // 分辨率 (仅 Pro)
  image_urls?: string[];             // 参考图片 (Edit/Pro)
}
```

#### 状态查询

```
GET /api/v1/jobs/recordInfo?taskId={taskId}
```

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "state": "success",
    "resultJson": "{\"resultUrls\":[\"https://...\"]}"
  }
}
```

---

### 2. Midjourney

#### 模型信息

| 模型 ID | 名称 | 功能 | 积分 |
|---------|------|------|------|
| `midjourney` | Midjourney | 文生图、图生图、风格参考 | 15 |

#### API 端点

```
POST /api/v1/mj/generate
```

#### 请求示例

```typescript
{
  taskType: "mj_txt2img",
  prompt: "A futuristic city at night --ar 16:9 --v 7",
  version: "7",
  speed: "fast",
  aspectRatio: "16:9"
}
```

#### 任务类型

```typescript
type MidjourneyTaskType = 
  | "mj_txt2img"           // 文生图
  | "mj_img2img"           // 图生图
  | "mj_video"             // 视频
  | "mj_style_reference"   // 风格参考
  | "mj_omni_reference";   // 全能参考
```

#### 版本选项

```typescript
type MidjourneyVersion = "7" | "6.1" | "6" | "5.2" | "niji6";
```

#### 速度选项

```typescript
type MidjourneySpeed = "relaxed" | "fast" | "turbo";
```

#### 参数说明

```typescript
interface MidjourneyRequest {
  taskType: MidjourneyTaskType;      // 任务类型 (必填)
  prompt: string;                    // 提示词 (必填)
  aspectRatio?: string;              // 宽高比
  version?: MidjourneyVersion;       // 版本
  speed?: MidjourneySpeed;           // 速度
  fileUrls?: string[];               // 参考图片 URL
  variety?: number;                  // 多样性 (0-100)
  stylization?: number;              // 风格化 (0-1000)
  weirdness?: number;                // 创意度 (0-3000)
  enableTranslation?: boolean;       // 启用翻译
}
```

#### 状态查询

```
GET /api/v1/mj/record-info?taskId={taskId}
```

---

### 3. Flux Kontext

#### 模型列表

| 模型 ID | 名称 | 功能 | 积分 |
|---------|------|------|------|
| `flux-kontext-pro` | Flux Kontext Pro | 文生图、图生图 | 10 |
| `flux-kontext-max` | Flux Kontext Max | 文生图、图生图 (最高质量) | 15 |

#### API 端点

```
POST /api/v1/flux/kontext/generate
```

#### 请求示例

```typescript
{
  prompt: "A serene landscape with mountains",
  model: "flux-kontext-pro",
  aspectRatio: "16:9",
  outputFormat: "png"
}
```

#### 参数说明

```typescript
interface FluxKontextRequest {
  prompt: string;                    // 提示词 (必填)
  model: "flux-kontext-pro" | "flux-kontext-max";  // 模型 (必填)
  aspectRatio?: string;              // 宽高比: "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"
  inputImage?: string;               // 输入图片 URL (图生图)
  outputFormat?: "jpeg" | "png";     // 输出格式
  enableTranslation?: boolean;       // 启用翻译 (默认: true)
  promptUpsampling?: boolean;        // 提示词增强 (默认: false)
}
```

#### 状态查询

```
GET /api/v1/flux/kontext/record-info?taskId={taskId}
```

---

### 4. GPT-4o Image

#### 模型信息

| 模型 ID | 名称 | 功能 | 积分 |
|---------|------|------|------|
| `gpt4o-image` | GPT-4o Image | 文生图、图生图 | 10 |

#### API 端点

```
POST /api/v1/gpt4o-image/generate
```

#### 请求示例

```typescript
{
  prompt: "A modern office space",
  size: "1:1",
  nVariants: 2
}
```

#### 参数说明

```typescript
interface Gpt4oImageRequest {
  prompt: string;                    // 提示词 (必填)
  size?: "1:1" | "3:2" | "2:3";     // 尺寸
  nVariants?: 1 | 2 | 4;            // 变体数量
  filesUrl?: string[];               // 参考图片
  maskUrl?: string;                  // 遮罩图片
  enableFallback?: boolean;          // 启用降级
}
```

#### 状态查询

```
GET /api/v1/gpt4o-image/record-info?taskId={taskId}
```

---

### 5. Z-Image (Tongyi-MAI)

#### 模型信息

| 模型 ID | 名称 | 功能 | 积分 |
|---------|------|------|------|
| `z-image` | Z-Image Turbo | 文生图 (快速、真实感) | 8 |

#### API 端点

```
POST /api/v1/jobs/createTask
```

#### 请求示例

```typescript
{
  model: "z-image",
  input: {
    prompt: "A photorealistic portrait",
    aspect_ratio: "1:1"
  }
}
```

#### 参数说明

```typescript
interface ZImageRequest {
  prompt: string;                    // 提示词 (必填)
  aspect_ratio: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";  // 宽高比 (必填)
}
```

---

## 视频生成 API

### 1. Veo 3.1 Fast (Google)

#### 模型信息

| 模型 ID | 名称 | 功能 | 积分 |
|---------|------|------|------|
| `veo-3.1-fast` | Veo 3.1 Fast | 文生视频、图生视频、首尾帧、参考图 | 100 |

#### 生成类型

```typescript
type Veo3GenerationType = 
  | "TEXT_2_VIDEO"                    // 文生视频
  | "IMAGE_2_VIDEO"                   // 单图生视频
  | "FIRST_AND_LAST_FRAMES_2_VIDEO"   // 首尾帧生视频
  | "REFERENCE_2_VIDEO";              // 参考图生视频
```

#### API 端点

```
POST /api/v1/veo/generate
```

#### 请求示例

**文生视频**:
```typescript
{
  prompt: "A drone shot of a coastal city at sunset",
  model: "veo3_fast",
  generationType: "TEXT_2_VIDEO",
  aspectRatio: "16:9"
}
```

**图生视频**:
```typescript
{
  prompt: "Camera slowly zooms in",
  model: "veo3_fast",
  generationType: "IMAGE_2_VIDEO",
  aspectRatio: "16:9",
  imageUrls: ["https://..."]
}
```

**首尾帧生视频**:
```typescript
{
  prompt: "Smooth transition from start to end",
  model: "veo3_fast",
  generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO",
  aspectRatio: "16:9",
  imageUrls: ["https://start.jpg", "https://end.jpg"]
}
```

**参考图生视频**:
```typescript
{
  prompt: "Animate in the style of reference images",
  model: "veo3_fast",
  generationType: "REFERENCE_2_VIDEO",
  aspectRatio: "16:9",  // 仅支持 16:9
  imageUrls: ["https://ref1.jpg", "https://ref2.jpg", "https://ref3.jpg"]
}
```

#### 参数说明

```typescript
interface Veo3GenerateRequest {
  prompt: string;                    // 提示词 (必填)
  model?: "veo3" | "veo3_fast";     // 模型 (默认: veo3_fast)
  generationType?: Veo3GenerationType;  // 生成类型
  aspectRatio?: "16:9" | "9:16" | "Auto";  // 宽高比
  imageUrls?: string[];              // 图片 URL (根据类型)
  seeds?: number;                    // 随机种子
  enableTranslation?: boolean;       // 启用翻译
  watermark?: string;                // 水印
  callBackUrl?: string;              // 回调 URL
}
```

#### 规格限制

- **分辨率**: 720p (固定)
- **时长**: 8 秒 (固定)
- **宽高比**: 16:9 或 9:16
- **参考图模式**: 仅支持 16:9，1-4 张图片

#### 状态查询

```
GET /api/v1/veo/record-info?taskId={taskId}
```

#### 扩展视频

```
POST /api/v1/veo/extend
```

```typescript
{
  taskId: "original_task_id",
  prompt: "Continue the scene"
}
```

#### 获取 1080p 视频

```
GET /api/v1/veo/get-1080p-video?taskId={taskId}
```

---

### 2. Sora 2 / Sora 2 Pro (OpenAI)

#### 模型列表

| 模型 ID | 名称 | 模式 | 分辨率 | 时长 | 积分 |
|---------|------|------|--------|------|------|
| `sora-2-text-to-video` | Sora 2 | Fast | 720p | 10s/15s | 80/120 |
| `sora-2-image-to-video` | Sora 2 Image | Fast | 720p | 10s/15s | 80/120 |
| `sora-2-pro-text-to-video` | Sora 2 Pro | Quality | 720p/1080p | 10s/15s | 150-600 |
| `sora-2-pro-image-to-video` | Sora 2 Pro Image | Quality | 720p/1080p | 10s/15s | 150-600 |

#### 积分计算

**Sora 2 (Fast)**:
- 720p 10s = 80 积分
- 720p 15s = 120 积分

**Sora 2 Pro (Quality)**:
- 720p 10s = 150 积分
- 720p 15s = 300 积分
- 1080p 10s = 300 积分
- 1080p 15s = 600 积分

#### API 端点

```
POST /api/v1/jobs/createTask
```

#### 请求示例

**文生视频**:
```typescript
{
  model: "sora-2-text-to-video",
  input: {
    prompt: "A cinematic shot of a futuristic city",
    aspect_ratio: "landscape",
    n_frames: "10",
    size: "Standard",
    remove_watermark: true
  }
}
```

**图生视频**:
```typescript
{
  model: "sora-2-image-to-video",
  input: {
    prompt: "Camera pans across the scene",
    image_urls: ["https://..."],
    aspect_ratio: "landscape",
    n_frames: "15",
    size: "High",
    remove_watermark: true
  }
}
```

#### 参数说明

```typescript
interface Sora2Input {
  prompt: string;                    // 提示词 (必填)
  image_urls?: string[];             // 图片 URL (图生视频)
  aspect_ratio?: "portrait" | "landscape";  // 宽高比
  n_frames?: "10" | "15";           // 时长 (秒)
  size?: "Standard" | "High";        // 分辨率 (Standard=720p, High=1080p)
  remove_watermark?: boolean;        // 移除水印
}
```

#### 状态查询

```
GET /api/v1/jobs/recordInfo?taskId={taskId}
```

---

### 3. Runway Gen-3 Alpha

#### 模型信息

| 功能 | 分辨率 | 时长 | 积分 |
|------|--------|------|------|
| 文生视频 | 720p/1080p | 5s/10s | 待定 |
| 图生视频 | 720p/1080p | 5s/10s | 待定 |

#### API 端点

```
POST /api/v1/runway/generate
```

#### 请求示例

```typescript
{
  prompt: "A time-lapse of clouds moving",
  duration: 10,
  quality: "1080p",
  aspectRatio: "16:9",
  imageUrl: "https://..."  // 可选
}
```

#### 参数说明

```typescript
interface RunwayGenerateRequest {
  prompt: string;                    // 提示词 (必填)
  duration?: 5 | 10;                // 时长 (秒)
  quality?: "720p" | "1080p";       // 质量
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";  // 宽高比
  imageUrl?: string;                 // 参考图片
  waterMark?: string;                // 水印
}
```

#### 状态查询

```
GET /api/v1/runway/record-detail?taskId={taskId}
```

#### 扩展视频

```
POST /api/v1/runway/extend
```

---

### 4. Luma Ray 2 (视频修改)

#### API 端点

```
POST /api/v1/modify/generate
```

#### 请求示例

```typescript
{
  prompt: "Add rain effect to the video",
  videoUrl: "https://...",
  watermark: "my_watermark"
}
```

#### 参数说明

```typescript
interface LumaModifyRequest {
  prompt: string;                    // 修改提示词 (必填)
  videoUrl: string;                  // 原视频 URL (必填)
  callBackUrl?: string;              // 回调 URL
  watermark?: string;                // 水印
}
```

#### 状态查询

```
GET /api/v1/modify/record-info?taskId={taskId}
```

---

### 5. Wan Video (2.2 / 2.5)

#### 模型列表

| 模型 ID | 版本 | 功能 | 分辨率 | 时长 |
|---------|------|------|--------|------|
| `wan/2-2-a14b-text-to-video-turbo` | 2.2 | 文生视频 | 480p/580p/720p | 固定 |
| `wan/2-2-a14b-image-to-video-turbo` | 2.2 | 图生视频 | 480p/580p/720p | 固定 |
| `wan/2-5-text-to-video` | 2.5 | 文生视频 | 720p/1080p | 5s/10s |
| `wan/2-5-image-to-video` | 2.5 | 图生视频 | 720p/1080p | 5s/10s |

#### API 端点

```
POST /api/v1/jobs/createTask
```

#### 请求示例 (Wan 2.5)

```typescript
{
  model: "wan/2-5-text-to-video",
  input: {
    prompt: "A peaceful forest scene",
    duration: "10",
    resolution: "1080p"
  }
}
```

#### 参数说明

**Wan 2.2**:
```typescript
interface Wan22Input {
  prompt: string;                    // 提示词 (必填)
  image_url?: string;                // 图片 URL
  resolution?: "480p" | "580p" | "720p";  // 分辨率
  aspect_ratio?: "auto" | "16:9" | "9:16" | "1:1";  // 宽高比
}
```

**Wan 2.5**:
```typescript
interface Wan25Input {
  prompt: string;                    // 提示词 (必填)
  image_url?: string;                // 图片 URL
  duration?: "5" | "10";            // 时长 (秒)
  resolution?: "720p" | "1080p";    // 分辨率
}
```

---

## 音乐生成 API

### Suno (V3.5 ~ V5)

#### 模型列表

| 模型 ID | 名称 | 功能 | 积分 |
|---------|------|------|------|
| `V3_5` | Suno V3.5 | 文生音乐、歌词 | 15 |
| `V4` | Suno V4 | 文生音乐、歌词、延长 | 20 |
| `V4_5` | Suno V4.5 | 文生音乐、歌词、延长 | 25 |
| `V4_5_Plus` | Suno V4.5 Plus | 文生音乐、歌词、延长 | 30 |
| `V5` | Suno V5 | 文生音乐、歌词、延长 (最新) | 35 |

#### API 端点

**生成音乐**:
```
POST /api/v1/generate
```

**延长音乐**:
```
POST /api/v1/generate/extend
```

**生成歌词**:
```
POST /api/v1/lyrics
```

**查询状态**:
```
GET /api/v1/generate/record-info?taskId={taskId}
```

#### 请求示例

**生成音乐**:
```typescript
{
  model: "V5",
  prompt: "A upbeat pop song about summer",
  customMode: false,
  instrumental: false,
  style: "pop, energetic",
  title: "Summer Vibes"
}
```

**生成歌词**:
```typescript
{
  prompt: "A song about friendship and adventure"
}
```

**延长音乐**:
```typescript
{
  audioId: "audio_id_from_previous_generation",
  prompt: "Continue with a guitar solo",
  continueAt: 120,  // 从 120 秒开始延长
  model: "V5"
}
```

#### 参数说明

**生成音乐**:
```typescript
interface SunoGenerateRequest {
  prompt: string;                    // 提示词 (必填)
  model?: SunoModel;                 // 模型版本
  customMode?: boolean;              // 自定义模式
  instrumental?: boolean;            // 纯音乐 (无歌词)
  style?: string;                    // 音乐风格
  title?: string;                    // 歌曲标题
}
```

**延长音乐**:
```typescript
interface SunoExtendRequest {
  audioId: string;                   // 原音频 ID (必填)
  prompt: string;                    // 延长提示词 (必填)
  continueAt?: number;               // 延长起始时间 (秒)
  model?: SunoModel;                 // 模型版本
  style?: string;                    // 音乐风格
  title?: string;                    // 歌曲标题
}
```

**生成歌词**:
```typescript
interface SunoLyricsRequest {
  prompt: string;                    // 歌词主题 (必填)
}
```

#### 响应示例

**音乐生成成功**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "status": "SUCCESS",
    "response": {
      "sunoData": [
        {
          "id": "audio_123",
          "title": "Summer Vibes",
          "audio_url": "https://...",
          "image_url": "https://...",
          "video_url": "https://...",
          "duration": 180,
          "style": "pop, energetic"
        }
      ]
    }
  }
}
```

**歌词生成成功**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "lyrics": "[Verse 1]\nWalking down the sunny street...",
    "title": "Summer Days"
  }
}
```

---

## 文件上传 API

### 1. Base64 上传

#### API 端点

```
POST /api/file-base64-upload
```

#### 请求示例

```typescript
{
  base64Data: "iVBORw0KGgoAAAANSUhEUgAA...",  // 不包含 data:image/png;base64, 前缀
  uploadPath: "generation/video",
  fileName: "input-image.png"
}
```

#### 参数说明

```typescript
interface FileBase64UploadRequest {
  base64Data: string;                // Base64 数据 (必填，不含前缀)
  uploadPath?: string;               // 上传路径
  fileName?: string;                 // 文件名
}
```

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "success": true,
    "fileName": "input-image.png",
    "filePath": "generation/video/input-image.png",
    "downloadUrl": "https://cdn.kie.ai/...",
    "fileSize": 102400,
    "mimeType": "image/png",
    "uploadedAt": "2026-02-10T12:00:00Z"
  }
}
```

---

### 2. URL 上传

#### API 端点

```
POST /api/file-url-upload
```

#### 请求示例

```typescript
{
  fileUrl: "https://example.com/image.jpg",
  uploadPath: "generation/image",
  fileName: "reference.jpg"
}
```

#### 参数说明

```typescript
interface FileUrlUploadRequest {
  fileUrl: string;                   // 文件 URL (必填)
  uploadPath?: string;               // 上传路径
  fileName?: string;                 // 文件名
}
```

---

## 积分系统

### 积分计算

#### 图片生成

| 模型 | 积分/张 |
|------|---------|
| Nano Banana | 5 |
| Nano Banana Edit | 8 |
| Nano Banana Pro | 15 |
| Z-Image | 8 |
| Midjourney | 15 |
| Flux Kontext Pro | 10 |
| Flux Kontext Max | 15 |
| GPT-4o Image | 10 |

#### 视频生成

| 模型 | 规格 | 积分/个 |
|------|------|---------|
| Veo 3.1 Fast | 720p 8s | 100 |
| Sora 2 | 720p 10s | 80 |
| Sora 2 | 720p 15s | 120 |
| Sora 2 Pro | 720p 10s | 150 |
| Sora 2 Pro | 720p 15s | 300 |
| Sora 2 Pro | 1080p 10s | 300 |
| Sora 2 Pro | 1080p 15s | 600 |

#### 音乐生成

| 模型 | 积分/首 |
|------|---------|
| Suno V3.5 | 15 |
| Suno V4 | 20 |
| Suno V4.5 | 25 |
| Suno V4.5 Plus | 30 |
| Suno V5 | 35 |

### 积分扣除逻辑

```typescript
// 优先扣除订阅积分，再扣除一次性积分
async function deductKieCredits(
  type: 'image' | 'video' | 'music',
  modelId: string,
  notes: string,
  options?: {
    size?: 'Standard' | 'High';
    duration?: '10' | '15';
  }
): Promise<CreditDeductionResult>
```

### 积分退款逻辑

```typescript
// 生成失败时自动退款
async function refundKieCredits(
  amount: number,
  notes: string,
  originalLogId?: string
): Promise<CreditRefundResult>
```

### 积分检查

```typescript
// 生成前检查积分是否充足
async function checkKieCredits(
  type: 'image' | 'video' | 'music',
  modelId: string,
  options?: {
    size?: 'Standard' | 'High';
    duration?: '10' | '15';
  }
): Promise<{ 
  hasCredits: boolean; 
  required: number; 
  available: number 
}>
```

---

## 项目集成

### 文件结构

```
lib/kie/
├── client.ts          # KIE Client 主类
├── types.ts           # TypeScript 类型定义
├── credits.ts         # 积分管理
└── index.ts           # 公共导出

app/api/
├── generation/
│   ├── image/route.ts    # 图片生成 API
│   ├── video/route.ts    # 视频生成 API
│   └── storyboard-prompt/route.ts  # 分镜提示词
└── kie/
    ├── image/route.ts    # KIE 图片 API (旧版)
    ├── video/route.ts    # KIE 视频 API (旧版)
    └── music/route.ts    # KIE 音乐 API

components/
├── image-generation/
│   └── ImageGenerationPage.tsx
├── video-generation/
│   ├── VideoGenerationPage.tsx
│   ├── VideoModelSelector.tsx
│   ├── VideoParameterPanel.tsx
│   └── VideoPreviewPanel.tsx
└── kie/
    └── MusicGenerationPage.tsx
```

### 初始化 Client

```typescript
import { getKieClient } from '@/lib/kie';

// 单例模式 (推荐)
const client = getKieClient();

// 或自定义配置
import { createKieClient } from '@/lib/kie';

const client = createKieClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.kie.ai',
  timeout: 30000
});
```

### 使用示例

#### 1. 图片生成

```typescript
import { getKieClient } from '@/lib/kie';

async function generateImage() {
  const client = getKieClient();
  
  // 创建任务
  const taskId = await client.generateNanoBananaImage({
    model: 'google/nano-banana',
    input: {
      prompt: 'A beautiful sunset',
      aspect_ratio: '16:9',
      output_format: 'png'
    }
  });
  
  // 轮询等待完成
  const imageUrls = await client.waitForNanoBananaCompletion(taskId);
  
  return imageUrls[0];
}
```

#### 2. 视频生成

```typescript
import { getKieClient } from '@/lib/kie';

async function generateVideo() {
  const client = getKieClient();
  
  // Veo 3.1 Fast
  const taskId = await client.generateVeo3Video({
    prompt: 'A drone shot of mountains',
    model: 'veo3_fast',
    generationType: 'TEXT_2_VIDEO',
    aspectRatio: '16:9'
  });
  
  // 轮询等待完成
  const videoUrls = await client.waitForVeo3Completion(taskId, {
    intervalMs: 15000,
    maxAttempts: 60,
    onProgress: (attempt, status) => {
      console.log(`Attempt ${attempt}:`, status);
    }
  });
  
  return videoUrls[0];
}
```

#### 3. 音乐生成

```typescript
import { getKieClient } from '@/lib/kie';

async function generateMusic() {
  const client = getKieClient();
  
  // 生成音乐
  const taskId = await client.generateSunoMusic({
    prompt: 'An upbeat pop song',
    model: 'V5',
    style: 'pop, energetic',
    title: 'Summer Vibes'
  });
  
  // 轮询等待完成
  const result = await client.waitForSunoCompletion(taskId);
  
  return result.sunoData[0];
}
```

#### 4. 文件上传

```typescript
import { getKieClient } from '@/lib/kie';

async function uploadImage(base64Data: string) {
  const client = getKieClient();
  
  const result = await client.uploadFileBase64({
    base64Data: base64Data.split(',')[1], // 移除 data:image/png;base64, 前缀
    uploadPath: 'generation/video',
    fileName: `input-${Date.now()}.png`
  });
  
  return result.downloadUrl;
}
```

### 积分管理集成

```typescript
import { 
  deductKieCredits, 
  checkKieCredits, 
  refundKieCredits 
} from '@/lib/kie/credits';

async function generateWithCredits() {
  // 1. 检查积分
  const check = await checkKieCredits('video', 'veo-3.1-fast');
  if (!check.hasCredits) {
    throw new Error(`Insufficient credits. Required: ${check.required}, Available: ${check.available}`);
  }
  
  // 2. 扣除积分
  const deductResult = await deductKieCredits(
    'video',
    'veo-3.1-fast',
    'Video generation: A beautiful scene'
  );
  
  if (!deductResult.success) {
    throw new Error(deductResult.error);
  }
  
  try {
    // 3. 生成视频
    const client = getKieClient();
    const taskId = await client.generateVeo3Video({
      prompt: 'A beautiful scene',
      model: 'veo3_fast',
      generationType: 'TEXT_2_VIDEO',
      aspectRatio: '16:9'
    });
    
    const videoUrls = await client.waitForVeo3Completion(taskId);
    return videoUrls[0];
    
  } catch (error) {
    // 4. 失败时退款
    if (deductResult.logId) {
      await refundKieCredits(
        deductResult.creditsDeducted || 0,
        `Refund for failed generation: ${error.message}`,
        deductResult.logId
      );
    }
    throw error;
  }
}
```

### API 路由集成

```typescript
// app/api/generation/video/route.ts
import { apiResponse } from '@/lib/api-response';
import { getKieClient } from '@/lib/kie';
import { deductKieCredits, refundKieCredits } from '@/lib/kie/credits';

export async function POST(req: Request) {
  let creditResult: any;
  
  try {
    const body = await req.json();
    
    // 扣除积分
    creditResult = await deductKieCredits('video', body.modelId, 'Video generation');
    if (!creditResult.success) {
      return apiResponse.badRequest(creditResult.error);
    }
    
    // 生成视频
    const client = getKieClient();
    const taskId = await client.generateVeo3Video({
      prompt: body.prompt,
      model: 'veo3_fast',
      generationType: body.generationType,
      aspectRatio: body.aspectRatio
    });
    
    return apiResponse.success({
      taskId,
      creditsUsed: creditResult.creditsDeducted,
      remainingCredits: creditResult.remainingCredits
    });
    
  } catch (error: any) {
    // 失败时退款
    if (creditResult?.success && creditResult.logId) {
      await refundKieCredits(
        creditResult.creditsDeducted || 0,
        `Refund: ${error.message}`,
        creditResult.logId
      );
    }
    
    return apiResponse.serverError(error.message);
  }
}
```

---

## 错误处理

### 错误类型

```typescript
class KieUpstreamError extends Error {
  httpStatus?: number;           // HTTP 状态码
  upstreamCode?: number | string;  // KIE API 错误码
  upstreamMessage?: string;      // KIE API 错误信息
  rawBody?: string;              // 原始响应体
  isTimeout?: boolean;           // 是否超时
}
```

### 常见错误

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| 401 | 认证失败 | 检查 API Key |
| 400 | 参数错误 | 检查请求参数 |
| 429 | 请求过多 | 实现重试机制 |
| 500 | 服务器错误 | 稍后重试 |
| timeout | 请求超时 | 增加超时时间或重试 |

### 错误处理示例

```typescript
import { KieUpstreamError } from '@/lib/kie/client';

try {
  const taskId = await client.generateVeo3Video({...});
  const videoUrls = await client.waitForVeo3Completion(taskId);
} catch (error) {
  if (error instanceof KieUpstreamError) {
    if (error.isTimeout) {
      console.error('Request timeout, please try again');
    } else if (error.httpStatus === 401) {
      console.error('Authentication failed, check API key');
    } else if (error.upstreamCode) {
      console.error(`KIE API Error ${error.upstreamCode}: ${error.upstreamMessage}`);
    }
  } else {
    console.error('Unknown error:', error);
  }
}
```

### 重试机制

```typescript
async function generateWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const taskId = await client.generateVeo3Video({...});
      return await client.waitForVeo3Completion(taskId);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // 指数退避
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## 参考链接

### 官方文档

- **KIE.ai 官网**: https://kie.ai
- **KIE.ai API 文档**: https://kie.ai/docs
- **KIE.ai 控制台**: https://kie.ai/console

### 模型文档

- **Veo 3.1**: https://kie.ai/veo-3-1
- **Sora 2**: https://kie.ai/sora-2
- **Midjourney**: https://kie.ai/midjourney
- **Flux Kontext**: https://kie.ai/flux-kontext
- **Suno**: https://kie.ai/suno

### 项目相关

- **项目仓库**: (您的 GitHub 仓库)
- **部署地址**: (您的生产环境地址)
- **开发文档**: `.dev/` 目录

### 相关技术

- **Next.js**: https://nextjs.org
- **TypeScript**: https://www.typescriptlang.org
- **Drizzle ORM**: https://orm.drizzle.team
- **Cloudflare R2**: https://developers.cloudflare.com/r2

---

## 附录

### A. 完整类型定义

详见 `lib/kie/types.ts` 文件，包含所有 API 的 TypeScript 类型定义。

### B. 轮询配置

```typescript
export const DEFAULT_POLLING_OPTIONS = {
  image: {
    intervalMs: 5000,    // 5 秒
    maxAttempts: 60,     // 最多 5 分钟
  },
  video: {
    intervalMs: 15000,   // 15 秒
    maxAttempts: 60,     // 最多 15 分钟
  },
  music: {
    intervalMs: 10000,   // 10 秒
    maxAttempts: 36,     // 最多 6 分钟
  },
};
```

### C. 环境变量清单

```bash
# KIE.ai API
KIE_API_KEY=your_kie_api_key

# 数据库
DATABASE_URL=your_database_url

# 认证
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Cloudflare R2
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-cdn-domain.com

# Stripe (可选)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# 邮件 (可选)
RESEND_API_KEY=your_resend_api_key
```

### D. 项目命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 启动生产服务器
pnpm start

# 数据库
pnpm db:push      # 推送 schema
pnpm db:studio    # 打开数据库管理界面

# 代码检查
pnpm lint
pnpm type-check
```

---

## 更新日志

### v1.0.0 (2026-02-10)

- ✅ 完整的 KIE.ai API 文档
- ✅ 图片生成 API (5 个模型)
- ✅ 视频生成 API (5 个模型)
- ✅ 音乐生成 API (Suno V3.5-V5)
- ✅ 文件上传 API
- ✅ 积分系统集成
- ✅ 错误处理机制
- ✅ 项目集成示例

---

**文档维护**: 请在更新 API 或添加新功能时同步更新此文档。

**反馈**: 如有问题或建议，请提交 Issue 或 Pull Request。
