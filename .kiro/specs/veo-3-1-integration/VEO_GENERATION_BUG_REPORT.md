# Veo 3.1 Fast 创建失败问题诊断报告

## 问题描述
用户报告 Veo 3.1 Fast 视频生成失败。

## 根本原因分析

### 问题 1: Text-to-Video 模式缺少 generationType
**位置**: `components/video-generation/VideoGenerationPage.tsx` (Line 383-398)

**问题代码**:
```typescript
if (isVeo3) {
  const veoAspectRatio = params.aspect_ratio === "portrait" ? "9:16" : "16:9";
  requestBody.aspectRatio = veoAspectRatio;

  if (imageToVideoMode === "startEnd") {
    requestBody.generationType = "FIRST_AND_LAST_FRAMES_2_VIDEO";
    requestBody.images = [startImage, endImage].filter(Boolean);
  } else if (imageToVideoMode === "reference") {
    requestBody.generationType = "REFERENCE_2_VIDEO";
    requestBody.images = referenceImages;
  } else {
    // Single image mode with Veo
    requestBody.generationType = "IMAGE_2_VIDEO";
    requestBody.images = images;
  }
  // ...
}
```

**问题分析**:
1. 当 `generationType === "text-to-video"` 时，代码进入 `else` 分支
2. `else` 分支假设是 "Single image mode"，设置 `generationType = "IMAGE_2_VIDEO"`
3. 但 text-to-video 模式下 `images` 数组为空，导致发送了错误的 `generationType`
4. 应该在 text-to-video 模式下设置 `generationType = "TEXT_2_VIDEO"`

### 问题 2: 逻辑混淆
前端使用 `generationType` 和 `imageToVideoMode` 两个状态变量：
- `generationType`: "text-to-video" | "image-to-video"
- `imageToVideoMode`: "single" | "startEnd" | "reference"

但在构造 Veo 3.1 请求时，只检查了 `imageToVideoMode`，没有检查 `generationType`。

## 修复方案

### 修复 1: 正确处理 Text-to-Video 模式
```typescript
if (isVeo3) {
  const veoAspectRatio = params.aspect_ratio === "portrait" ? "9:16" : "16:9";
  requestBody.aspectRatio = veoAspectRatio;

  // 根据 generationType 和 imageToVideoMode 确定 Veo 的 generationType
  if (generationType === "text-to-video") {
    // Text-to-Video 模式
    requestBody.generationType = "TEXT_2_VIDEO";
  } else if (imageToVideoMode === "startEnd") {
    // Start/End Frame 模式
    requestBody.generationType = "FIRST_AND_LAST_FRAMES_2_VIDEO";
    requestBody.images = [startImage, endImage].filter(Boolean);
  } else if (imageToVideoMode === "reference") {
    // Reference 模式
    requestBody.generationType = "REFERENCE_2_VIDEO";
    requestBody.images = referenceImages;
  } else {
    // Single Image 模式
    requestBody.generationType = "IMAGE_2_VIDEO";
    requestBody.images = images;
  }

  // 清理 Sora 2 参数
  delete requestBody.aspect_ratio;
  delete requestBody.n_frames;
  delete requestBody.size;
  delete requestBody.remove_watermark;
}
```

### 修复 2: 后端验证增强
后端 API 路由已经有自动检测逻辑，但应该优先使用前端传递的 `generationType`：

```typescript
// 当前后端逻辑 (app/api/generation/video/route.ts Line 158-173)
let effectiveGenerationType = generationType;

if (!effectiveGenerationType) {
  // Auto-detect based on number of images
  if (uploadedImageUrls.length === 0) {
    effectiveGenerationType = "TEXT_2_VIDEO";
  } else if (uploadedImageUrls.length === 1) {
    effectiveGenerationType = "IMAGE_2_VIDEO";
  } else if (uploadedImageUrls.length === 2) {
    effectiveGenerationType = "FIRST_AND_LAST_FRAMES_2_VIDEO";
  } else if (uploadedImageUrls.length >= 3) {
    effectiveGenerationType = "REFERENCE_2_VIDEO";
  } else {
    effectiveGenerationType = "TEXT_2_VIDEO";
  }
}
```

这个逻辑是正确的，但前端没有传递正确的 `generationType`，导致后端自动检测失败。

## 测试场景

### 场景 1: Text-to-Video (修复前会失败)
- 选择 Veo 3.1 Fast
- 选择 Text-to-Video 模式
- 输入 prompt
- 不上传图片
- 点击生成
- **预期**: `generationType = "TEXT_2_VIDEO"`，`images = undefined`
- **实际 (修复前)**: `generationType = "IMAGE_2_VIDEO"`，`images = []`

### 场景 2: Single Image-to-Video
- 选择 Veo 3.1 Fast
- 选择 Image-to-Video > Single Image
- 上传 1 张图片
- 输入 prompt
- 点击生成
- **预期**: `generationType = "IMAGE_2_VIDEO"`，`images = [url]`

### 场景 3: Start/End Frame
- 选择 Veo 3.1 Fast
- 选择 Image-to-Video > Start & End Frame
- 上传 2 张图片
- 输入 prompt
- 点击生成
- **预期**: `generationType = "FIRST_AND_LAST_FRAMES_2_VIDEO"`，`images = [startUrl, endUrl]`

### 场景 4: Reference Images
- 选择 Veo 3.1 Fast
- 选择 Image-to-Video > Reference Images
- 上传 3-4 张图片
- 输入 prompt
- 点击生成
- **预期**: `generationType = "REFERENCE_2_VIDEO"`，`images = [url1, url2, url3, ...]`

## 影响范围
- **受影响功能**: Veo 3.1 Fast Text-to-Video 模式
- **严重程度**: 高 (P0) - 核心功能无法使用
- **其他模式**: Image-to-Video 的三种模式不受影响

## 修复优先级
**P0 - 立即修复**

## 相关文件
- `components/video-generation/VideoGenerationPage.tsx` (需要修复)
- `app/api/generation/video/route.ts` (后端逻辑正确，无需修改)
- `lib/kie/client.ts` (KIE Client 正确，无需修改)
