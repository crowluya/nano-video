# Kie.ai API 总览与调用方式

> 汇总本次会话中与 Kie.ai 相关的所有信息：用户提供的 Veo 3.1 文档要点、现有代码实现、可用端点、调用方式、首尾帧支持，以及测试文件。代码参考均基于当前仓库。

## 官方文档与链接
- Kie.ai 文档主页：<https://docs.kie.ai/>
- Veo 3.1 官方文档：<https://docs.kie.ai/veo3>（用户提供内容节选见下）
- 本地类型定义：`lib/kie/types.ts`
- 本地客户端实现：`lib/kie/client.ts`
- 本地模型配置：`config/models.ts`
- 本地测试用例：`test-veo31-api.ts`

## 用户提供的 Veo 3.1 文档要点
- 端点：`POST /api/v1/veo/generate`
- 模型：`veo3`（Quality），`veo3_fast`（Fast）
- 任务模式（generationType）：
  - `TEXT_2_VIDEO` 文本转视频
  - `FIRST_AND_LAST_FRAMES_2_VIDEO` 图转视频；1 张为首帧，2 张为首尾帧
  - `REFERENCE_2_VIDEO` 素材/参考图转视频（仅 `veo3_fast` 且 `16:9`）
- aspectRatio：`16:9` / `9:16` / `Auto`（仅 16:9 支持 1080P 获取）
- seeds：10000-99999
- 可选：`callBackUrl`、`enableTranslation`、`watermark`、`enableFallback`（已废弃）
- 1080P 获取：`GET /api/v1/veo/get-1080p-video?taskId=...`

## 首尾帧支持矩阵（图生视频）
- Veo 3.1 `FIRST_AND_LAST_FRAMES_2_VIDEO`：支持首帧+尾帧（传 2 张图）；传 1 张则仅首帧展开
- Veo 3.1 `REFERENCE_2_VIDEO`：素材参考（1-3 图），仅 `veo3_fast`，16:9
- Runway：仅首帧（单图 image-to-video）
- Sora 2：仅首帧（image_urls 单图）
- Wan 2.2 / 2.5：仅首帧（image_url 单图）
- Luma Ray2（modify）：视频到视频，不涉及首尾帧
- Runway Aleph：视频到视频，不涉及首尾帧

## 代码中的类型与端点（`lib/kie/types.ts` & `lib/kie/client.ts`）
- Veo 3.1：
  - 生成 `POST /api/v1/veo/generate`（`Veo3GenerateRequest`）
  - 状态 `GET /api/v1/veo/record-info?taskId=...`
  - 延长 `POST /api/v1/veo/extend`（`Veo3ExtendRequest`）
  - 1080P `GET /api/v1/veo/get-1080p-video?taskId=...`
- Runway：`/runway/generate`, `/runway/record-detail`, `/runway/extend`
- Runway Aleph：`/runway/aleph/generate`
- Luma：`/modify/generate`, `/modify/record-info`
- 4o Image：`/gpt4o-image/generate`, `/gpt4o-image/record-info`, `/gpt4o-image/download-url`
- Flux Kontext：`/flux/kontext/generate`, `/flux/kontext/record-info`
- Nano Banana：`/jobs/createTask`, `/jobs/recordInfo`
- Sora 2：`/jobs/createTask`, `/jobs/recordInfo`
- Midjourney：`/mj/generate`, `/mj/record-info`
- Wan 2.2 / 2.5：`/jobs/createTask`, `/jobs/recordInfo`
- Suno：`/generate`, `/generate/extend`, `/generate/record-info`, `/lyrics`
- 文件上传：`https://kieai.redpandaai.co/api/file-url-upload`, `/api/file-base64-upload`

## 模型配置要点（`config/models.ts`）
- Veo 3.1（Quality / Fast）
  - features: text-to-video, image-to-video, first-last-frame；Fast 额外支持 reference-to-video
  - aspectRatios: 16:9 / 9:16 / Auto；generationTypes 列出三种模式
- Runway: text-to-video / image-to-video / extend
- Luma: video-to-video modify
- Sora 2 / Sora 2 Pro: text-to-video, image-to-video（portrait/landscape, durations 10/15）
- Wan 2.2 / 2.5: text-to-video, image-to-video，含分辨率/时长
- Nano Banana & Flux Kontext & 4o Image: 多种尺寸/纵横比/格式
- Midjourney: 多 taskType、版本、速度、纵横比
- Suno: V3.5 / V4 / V4.5 / V4.5 Plus / V5

## 使用示例（核心片段）

### 初始化客户端
```ts
import { KieClient } from './lib/kie/client';
const client = new KieClient(process.env.KIE_API_KEY);
```

### Veo 3.1 文本转视频
```ts
const taskId = await client.generateVeo3Video({
  prompt: 'A dog playing in a park',
  model: 'veo3_fast',
  generationType: 'TEXT_2_VIDEO',
  aspectRatio: '16:9',
  enableTranslation: true,
});
```

### Veo 3.1 首尾帧图转视频
```ts
const taskId = await client.generateVeo3Video({
  prompt: 'Smooth transition between two scenes',
  model: 'veo3_fast',
  generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
  imageUrls: ['https://.../first.jpg', 'https://.../last.jpg'],
  aspectRatio: '16:9',
});
```

### Veo 3.1 素材参考转视频（仅 fast）
```ts
const taskId = await client.generateVeo3Video({
  prompt: 'Use the reference cat image to animate',
  model: 'veo3_fast',
  generationType: 'REFERENCE_2_VIDEO',
  imageUrls: ['https://.../ref.jpg'], // 1-3 images
  aspectRatio: '16:9',
});
```

### 查询状态（通用）
```ts
const status = await client.getVeo3Status(taskId);
// successFlag: 0=generating,1=success,2=create_task_failed,3=generate_failed
```

### 1080P 获取
```ts
await client.getVeo31080pVideo(taskId);
```

## 本地测试文件与结果
- 文件：`test-veo31-api.ts`
- 覆盖：TEXT_2_VIDEO、FIRST_AND_LAST_FRAMES_2_VIDEO（单图与双图）、REFERENCE_2_VIDEO（veo3_fast, 16:9）
- 示例任务成功创建（此前测试）：
  - TEXT_2_VIDEO: e42fe1e77374a747078ce8ac8bad297c
  - IMAGE_2_VIDEO (single): 8fd433162900ed719476b677aa900c52
  - FIRST_LAST_FRAME: b579ed702ced749b4d3d5a36b03bcb65
  - REFERENCE_2_VIDEO: 7f2552bfb4b048321181a0e2ccefa691

## 调用方式速查（端点 / 方法）
- Veo 3.1：`generateVeo3Video` / `getVeo3Status` / `extendVeo3Video` / `getVeo31080pVideo`
- Runway：`generateRunwayVideo` / `getRunwayStatus` / `extendRunwayVideo`
- Runway Aleph：`generateRunwayAlephVideo`
- Luma：`modifyLumaVideo` / `getLumaStatus`
- Sora 2：`generateSora2Video` / `getSora2Status`
- Wan：`generateWan22Video` / `generateWan25Video` / `getWanVideoStatus`
- Midjourney：`generateMidjourneyImage` / `getMidjourneyStatus`
- 4o Image：`generate4oImage` / `get4oImageStatus` / `get4oImageDownloadUrl`
- Flux Kontext：`generateFluxKontextImage` / `getFluxKontextStatus`
- Nano Banana：`generateNanoBananaImage` / `getNanoBananaStatus`
- Suno：`generateSunoMusic` / `extendSunoMusic` / `getSunoStatus` / `generateSunoLyrics`
- 上传：`uploadFileFromUrl` / `uploadFileBase64`

## 环境变量
- `KIE_API_KEY` 必填（示例在 `.env.local`）

## 参考路径
- 类型定义：`lib/kie/types.ts`
- 客户端：`lib/kie/client.ts`
- 模型配置：`config/models.ts`
- 测试：`test-veo31-api.ts`
