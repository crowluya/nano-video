# Veo 3.1 API 测试指南

## 测试环境准备

1. 确保 `.env.local` 中有有效的 `KIE_API_KEY`
2. 确保用户有足够的积分（至少 100 积分）
3. 启动开发服务器：`pnpm dev`

---

## 测试用例

### 1. TEXT_2_VIDEO（纯文本生成视频）

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/generation/video \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "modelId": "veo-3.1-fast",
    "provider": "kie",
    "prompt": "A cinematic drone shot of a waterfall in a lush forest",
    "aspectRatio": "16:9"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "taskId": "veo-task-xxx",
    "modelId": "veo-3.1-fast",
    "creditsUsed": 100,
    "remainingCredits": 900
  }
}
```

---

### 2. IMAGE_2_VIDEO（单图生成视频）

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/generation/video \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "modelId": "veo-3.1-fast",
    "provider": "kie",
    "prompt": "Camera slowly zooms in on the subject",
    "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="],
    "generationType": "IMAGE_2_VIDEO",
    "aspectRatio": "16:9"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "taskId": "veo-task-xxx",
    "modelId": "veo-3.1-fast",
    "creditsUsed": 100,
    "remainingCredits": 800
  }
}
```

---

### 3. FIRST_AND_LAST_FRAMES_2_VIDEO（首尾帧生成视频）

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/generation/video \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "modelId": "veo-3.1-fast",
    "provider": "kie",
    "prompt": "Person jumps into the air",
    "images": [
      "data:image/png;base64,START_FRAME_BASE64",
      "data:image/png;base64,END_FRAME_BASE64"
    ],
    "generationType": "FIRST_AND_LAST_FRAMES_2_VIDEO",
    "aspectRatio": "16:9"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "taskId": "veo-task-xxx",
    "modelId": "veo-3.1-fast",
    "creditsUsed": 100,
    "remainingCredits": 700
  }
}
```

---

### 4. REFERENCE_2_VIDEO（参考图生成视频）

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/generation/video \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "modelId": "veo-3.1-fast",
    "provider": "kie",
    "prompt": "A cinematic scene in this style",
    "images": [
      "data:image/png;base64,REF1_BASE64",
      "data:image/png;base64,REF2_BASE64",
      "data:image/png;base64,REF3_BASE64"
    ],
    "generationType": "REFERENCE_2_VIDEO",
    "aspectRatio": "16:9"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "taskId": "veo-task-xxx",
    "modelId": "veo-3.1-fast",
    "creditsUsed": 100,
    "remainingCredits": 600
  }
}
```

---

## 错误场景测试

### 5. 积分不足

**请求示例：**
```bash
# 用户只有 50 积分
curl -X POST http://localhost:3000/api/generation/video \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "modelId": "veo-3.1-fast",
    "provider": "kie",
    "prompt": "Test video"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": "Insufficient credits. Required: 100, Available: 50"
}
```

---

### 6. IMAGE_2_VIDEO 模式图片数量错误

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/generation/video \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "modelId": "veo-3.1-fast",
    "provider": "kie",
    "prompt": "Test",
    "images": ["data:image/png;base64,IMG1", "data:image/png;base64,IMG2"],
    "generationType": "IMAGE_2_VIDEO"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": "IMAGE_2_VIDEO mode requires exactly 1 image"
}
```

---

### 7. REFERENCE_2_VIDEO 模式使用 9:16

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/generation/video \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "modelId": "veo-3.1-fast",
    "provider": "kie",
    "prompt": "Test",
    "images": ["data:image/png;base64,IMG1", "data:image/png;base64,IMG2", "data:image/png;base64,IMG3"],
    "generationType": "REFERENCE_2_VIDEO",
    "aspectRatio": "9:16"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": "REFERENCE_2_VIDEO mode only supports 16:9 aspect ratio"
}
```

---

## 轮询状态测试

### 8. 检查任务状态

**请求示例：**
```bash
curl -X GET "http://localhost:3000/api/kie/status?taskId=veo-task-xxx&modelId=veo-3.1-fast" \
  -H "Cookie: your-session-cookie"
```

**预期响应（生成中）：**
```json
{
  "success": true,
  "data": {
    "status": "processing",
    "progress": 50
  }
}
```

**预期响应（完成）：**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "videoUrls": ["https://kie.ai/videos/xxx.mp4"]
  }
}
```

---

## 前端测试步骤

### 1. 访问视频生成页面
```
http://localhost:3000/[locale]/video-generation
```

### 2. 选择 Veo 3.1 Fast 模型
- 在模型选择器中选择 "Veo 3.1 Fast"
- 验证参数面板显示固定的 720p/8s
- 验证积分显示为 100

### 3. 测试 TEXT_2_VIDEO
- 不上传图片
- 输入提示词："A beautiful sunset over the ocean"
- 点击生成按钮
- 验证生成成功

### 4. 测试 IMAGE_2_VIDEO
- 选择 "Image to Video" 模式
- 选择 "Single Image" 子模式
- 上传 1 张图片
- 输入提示词："Camera pans across the scene"
- 点击生成按钮
- 验证生成成功

### 5. 测试 FIRST_AND_LAST_FRAMES_2_VIDEO
- 选择 "Image to Video" 模式
- 选择 "Start & End Frames" 子模式
- 上传开始帧和结束帧
- 输入提示词："Smooth transition between frames"
- 点击生成按钮
- 验证生成成功

### 6. 测试 REFERENCE_2_VIDEO
- 选择 "Image to Video" 模式
- 选择 "Reference Images" 子模式
- 上传 3 张参考图
- 确保选择 16:9 宽高比
- 输入提示词："A scene in this artistic style"
- 点击生成按钮
- 验证生成成功

---

## 验收标准

### 功能验收
- ✅ 所有 4 种模式都能成功生成视频
- ✅ 积分正确扣除（100 积分/次）
- ✅ 生成失败时自动退款
- ✅ 错误提示清晰友好

### 性能验收
- ✅ 图片上传响应时间 < 3 秒
- ✅ API 调用响应时间 < 5 秒
- ✅ 轮询间隔 15 秒
- ✅ 生成时间 3-5 分钟

### 用户体验验收
- ✅ 参数面板正确显示 Veo 3.1 的限制
- ✅ 积分不足时按钮禁用
- ✅ 图片上传支持预览
- ✅ 错误提示可操作（如提供购买积分链接）

---

## 常见问题排查

### Q1: 图片上传失败
**检查：**
- 图片大小是否超过 10MB
- 图片格式是否为 PNG/JPEG/WEBP
- KIE 文件上传服务是否可用

### Q2: 生成失败但未退款
**检查：**
- 查看 `taskCreditMappings` 表是否有记录
- 查看 `creditLogs` 表是否有退款记录
- 检查服务器日志

### Q3: 轮询超时
**检查：**
- KIE API 是否正常
- 任务是否真的失败了
- 轮询间隔和最大次数设置

---

**测试完成日期**: ___________  
**测试人员**: ___________  
**测试结果**: ⬜ 通过 / ⬜ 失败  
**备注**: ___________
