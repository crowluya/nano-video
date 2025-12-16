# AI Demo 问题梳理和修复

## 已出现的问题

### 1. ❌ 方法名不匹配错误
**错误信息**: `TypeError: client.generateMidjourney is not a function`

**原因**:
- API 路由中调用的方法名与 `KieClient` 实际方法名不一致
- 调用: `generateMidjourney()`, `generateNanoBanana()`, `generateFluxKontext()`
- 实际: `generateMidjourneyImage()`, `generateNanoBananaImage()`, `generateFluxKontextImage()`

**修复**:
- ✅ 更新 `app/api/ai-demo/text-to-image/route.ts` 使用正确的方法名
- ✅ 更新 `app/api/ai-demo/image-to-image/route.ts` 使用正确的方法名
- ✅ 更新 `app/api/ai-demo/image-to-video/route.ts` 使用正确的方法名

**影响范围**: Text to Image, Image to Image, Text/Image to Video

---

## 潜在问题和注意事项

### 2. ⚠️ 长时间轮询超时
**问题描述**:
- 图像生成通常需要 10-60 秒
- 视频生成通常需要 2-10 分钟
- 当前轮询配置可能不足

**当前配置**:
```typescript
// Text/Image to Image
maxAttempts: 60,
intervalMs: 2000,
// 总计: 60 * 2 = 120 秒 (2 分钟)

// Text/Image to Video
maxAttempts: 120,
intervalMs: 3000,
// 总计: 120 * 3 = 360 秒 (6 分钟)
```

**建议**:
- ✅ 当前配置对大多数情况足够
- 如果遇到超时，可以增加 `maxAttempts`
- 考虑添加前端进度提示

### 3. ⚠️ 前端用户体验
**问题描述**:
- 用户在等待期间没有进度反馈
- 长时间等待可能让用户以为系统卡死

**建议改进**:
```typescript
// 在前端添加轮询状态显示
const [generationStatus, setGenerationStatus] = useState<string>("");

// 显示状态: "Initializing...", "Processing...", "Almost done..."
```

### 4. ⚠️ 错误处理
**当前状态**: ✅ 已实现基本错误处理

**覆盖的错误类型**:
- API Key 错误
- 模型不支持错误
- 文件上传失败
- 任务生成失败
- 轮询超时

**建议**:
- 添加更详细的错误信息
- 区分临时错误（可重试）和永久错误

### 5. ⚠️ 资源管理
**问题描述**:
- AI Demo 不扣除积分（仅用于测试）
- 生成的文件存储在 kie.ai（2个月后自动删除）
- 没有保存到 R2 的选项

**建议**:
- 如果需要永久保存，使用 `/dashboard/image-gen` 等页面
- 考虑添加"保存到我的库"功能

### 6. ⚠️ 模型参数限制
**当前实现**: 使用固定参数

**Text to Image**:
- Nano Banana: `aspectRatio: "auto"`, `outputFormat: "png"`
- Midjourney: `version: "7"`, `speed: "fast"`, `aspectRatio: "1:1"`
- Flux Kontext: `aspectRatio: "1:1"`, `outputFormat: "png"`
- GPT-4o: `size: "1:1"`, `nVariants: 1`

**Image to Image**:
- 同上，但添加了图像输入

**Text/Image to Video**:
- Sora 2: `aspectRatio: "landscape"`, `duration: "10"`
- Veo 3: `aspectRatio: "16:9"`
- Wan: `resolution: "1080p"`, `duration: "10"`
- Runway: `quality: "1080p"`, `duration: 10`, `aspectRatio: "16:9"`

**建议**:
- 如果需要更多控制，可以在前端添加参数选择器
- 或者引导用户使用 `/dashboard/image-gen` 等专业页面

---

## 测试检查清单

### Text to Image
- [ ] Nano Banana 文本生成图像
- [ ] Midjourney 文本生成图像
- [ ] Flux Kontext Pro 文本生成图像
- [ ] Flux Kontext Max 文本生成图像
- [ ] GPT-4o Image 文本生成图像

### Image to Image
- [ ] Nano Banana Edit 图像编辑
- [ ] Midjourney 图像编辑
- [ ] Flux Kontext 图像编辑
- [ ] GPT-4o Image 图像编辑

### Text/Image to Video
- [ ] Sora 2 文本生成视频
- [ ] Sora 2 图像生成视频
- [ ] Veo 3.1 文本生成视频
- [ ] Veo 3.1 图像生成视频
- [ ] Runway Gen-3 生成视频
- [ ] Wan 2.5 文本生成视频
- [ ] Wan 2.5 图像生成视频

---

## 环境变量检查

确保以下环境变量已设置：
```bash
# 必需
KIE_API_KEY=your_kie_api_key

# 可选（用于 AI 聊天）
OPENROUTER_API_KEY=your_openrouter_key
```

---

## 常见错误和解决方案

### 错误: "Server configuration error: Missing KIE_API_KEY"
**解决**: 在 `.env.local` 中添加 `KIE_API_KEY`

### 错误: "Authentication error with Kie.ai API"
**解决**: 检查 API Key 是否正确且有效

### 错误: "Failed to upload image"
**解决**: 
- 检查图像大小（建议 < 10MB）
- 检查图像格式（PNG, JPG, WEBP）

### 错误: "Task polling timeout"
**解决**:
- 视频生成可能需要更长时间，这是正常的
- 可以增加 `maxAttempts` 或 `intervalMs`

### 错误: "Unknown image/video model"
**解决**:
- 检查 `config/models.ts` 中模型配置
- 确保模型 ID 正确

---

## 性能优化建议

### 1. 添加缓存
```typescript
// 缓存常用的生成结果
const cache = new Map<string, string>();
const cacheKey = `${modelId}:${prompt}`;
```

### 2. 批量处理
```typescript
// 允许用户一次生成多个变体
nVariants: 4  // 生成 4 个不同的图像
```

### 3. 预加载模型
```typescript
// 在用户选择模型时预热 API
await client.checkModelAvailability(modelId);
```

---

## 下一步改进

1. **添加进度条** - 显示生成进度
2. **添加历史记录** - 保存用户的生成历史
3. **添加收藏功能** - 允许用户收藏喜欢的结果
4. **添加分享功能** - 生成分享链接
5. **添加参数预设** - 常用参数组合快速选择
6. **添加批量生成** - 一次生成多个结果
7. **添加编辑功能** - 对生成结果进行二次编辑
8. **添加对比功能** - 对比不同模型的结果

---

## 相关文档

- [Kie.ai API 文档](.dev/KIE_AI_API_DOCUMENTATION.md)
- [Kie.ai 集成指南](./KIE_AI_SETUP.md)
- [模型配置](../config/models.ts)
- [Kie.ai 客户端](../lib/kie/client.ts)

