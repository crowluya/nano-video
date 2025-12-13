# Kie.ai API 集成使用指南

## 环境变量配置

在 `.env.local` 文件中添加以下环境变量：

```bash
# Kie.ai API Key (必需)
KIE_API_KEY=your_kie_api_key_here

# OpenRouter API Key (用于 AI 聊天和剪辑建议)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Cloudflare R2 (用于永久存储生成的内容)
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-r2-domain.com
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
```

## 功能说明

### 1. 图像生成
- **支持模型**: Nano Banana, Midjourney, Flux Kontext, GPT-4o Image
- **访问路径**: `/dashboard/image-gen` 或 `/dashboard/studio`
- **积分消耗**: 5-15 积分/张（根据模型不同）

### 2. 视频生成
- **支持模型**: Sora 2, Veo 3.1, Runway, Wan
- **访问路径**: `/dashboard/video-gen` 或 `/dashboard/studio`
- **积分消耗**: 50-150 积分/个（根据模型不同）
- **处理时间**: 通常需要 2-10 分钟

### 3. 音乐生成 (Suno)
- **支持模型**: Suno V3.5, V4, V4.5, V4.5 Plus, V5
- **访问路径**: `/dashboard/music-gen` 或 `/dashboard/studio`
- **积分消耗**: 15-35 积分/首（根据模型不同）

### 4. 一体化工作流
- **访问路径**: `/dashboard/studio`
- **工作流程**: 
  1. AI 聊天生成优化 Prompt
  2. 生成图像
  3. 生成视频/音乐
  4. 使用 Remotion 进行剪辑

### 5. 视频剪辑 (Remotion)
- **功能**: 浏览器端视频剪辑
- **支持**: 时间线编辑、多轨道、动画效果
- **导出**: 浏览器端渲染（建议限制在 2 分钟以内）

## 文件存储策略

### 临时存储 (kie.ai)
- **生成的文件**: 保留 2 个月
- **上传的文件**: 保留 3 天
- **用途**: 生成过程中的临时存储

### 永久存储 (Cloudflare R2)
- **用途**: 用户手动保存的重要内容
- **操作**: 在素材库中点击"保存"按钮
- **访问**: 通过 R2 公共 URL 访问

## API 端点

### 图像生成
```
POST /api/kie/image
Body: {
  modelId: string,
  prompt: string,
  aspectRatio?: string,
  ...
}
```

### 视频生成
```
POST /api/kie/video
Body: {
  modelId: string,
  prompt: string,
  imageUrl?: string,
  aspectRatio?: string,
  ...
}
```

### 音乐生成
```
POST /api/kie/music
Body: {
  action: "generate" | "extend" | "lyrics",
  modelId?: string,
  prompt: string,
  ...
}
```

### 任务状态查询
```
GET /api/kie/status?taskId=xxx&type=image|video|music&modelId=xxx
```

### 文件上传
```
POST /api/kie/upload
Body: {
  type: "url" | "base64",
  fileUrl?: string,
  base64Data?: string,
  ...
}
```

### 保存到 R2
```
POST /api/kie/save-to-r2
Body: {
  sourceUrl: string,
  type: "image" | "video" | "audio",
  fileName?: string,
  path?: string
}
```

## 积分定价建议

| 操作 | 建议积分 |
|------|---------|
| AI 聊天 | 1 积分/次 |
| 图像生成 (Nano Banana) | 5 积分/张 |
| 图像生成 (Midjourney) | 15 积分/张 |
| 图像生成 (Flux/GPT-4o) | 10 积分/张 |
| 视频生成 (Sora 2) | 100 积分/个 |
| 视频生成 (Veo 3.1) | 60-80 积分/个 |
| 音乐生成 (Suno) | 20-35 积分/首 |
| 视频导出 | 30 积分/次 |

## 注意事项

1. **视频生成时间**: 视频生成通常需要 2-10 分钟，请耐心等待
2. **积分扣除**: 积分在任务创建时立即扣除，即使任务失败也不会退还
3. **临时存储**: kie.ai 生成的文件会在 2 个月后自动删除，请及时保存重要内容到 R2
4. **浏览器渲染**: Remotion 浏览器端渲染对性能有要求，建议视频长度不超过 2 分钟
5. **API 限制**: 请遵守 kie.ai 的 API 使用限制和速率限制

## 故障排查

### 问题: API 返回 401 错误
- 检查 `KIE_API_KEY` 是否正确设置
- 确认 API Key 是否有效

### 问题: 积分不足
- 检查用户积分余额
- 在 Dashboard 中购买积分套餐

### 问题: 任务一直处于处理中
- 检查网络连接
- 查看浏览器控制台错误
- 某些任务可能需要更长时间（特别是视频生成）

### 问题: Remotion 组件不显示
- 确认已安装 `remotion` 和 `@remotion/player`
- 检查浏览器控制台是否有错误
- 确认项目配置正确

## 开发说明

### 添加新模型
1. 在 `config/models.ts` 中添加模型配置
2. 在 `lib/kie/client.ts` 中添加对应的生成方法
3. 在相应的 API 路由中添加处理逻辑

### 自定义积分定价
在 `config/models.ts` 中修改 `creditsPerGeneration` 字段

### 扩展 Remotion 功能
- 编辑 `lib/remotion/types.ts` 添加新的轨道类型
- 在 `components/remotion/VideoComposition.tsx` 中添加渲染逻辑

