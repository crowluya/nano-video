# Veo 3.1 Fast 视频生成集成 - 需求文档

## 1. 概述

### 1.1 背景
当前系统已支持 Sora 2 和 Sora 2 Pro 视频生成模型，但缺少对 Google Veo 3.1 Fast 模型的完整支持。Veo 3.1 Fast 是一个高性价比的视频生成模型，具有以下特点：
- 固定 720p 分辨率，8 秒时长
- 支持多种生成模式（文本、图片、首尾帧、参考图）
- 固定 100 积分/次，价格透明
- 生成速度快（3-5 分钟）

### 1.2 目标
完善 Veo 3.1 Fast 模型的集成，使其成为系统中的一个可选视频生成模型，与 Sora 2 并列提供给用户。

### 1.3 范围
- ✅ 包含：前端 UI、API 路由、KIE Client、类型定义、积分计算
- ❌ 不包含：Veo 3.1 Quality 版本（高质量慢速版）、视频编辑功能

---

## 2. 用户故事

### US-1: 作为用户，我希望能选择 Veo 3.1 Fast 模型生成视频
**优先级：** P0 (必须)

**场景：**
- 用户进入视频生成页面
- 在模型选择器中看到 "Veo 3.1 Fast" 选项
- 选择后，系统自动调整参数面板（锁定 720p/8s）
- 显示积分消耗：100 积分

**验收标准：**
1. 模型选择器中显示 "Veo 3.1 Fast (Google)" 选项
2. 选择后，分辨率和时长选项被禁用或隐藏
3. 积分显示为固定 100 积分
4. 支持 16:9 和 9:16 两种宽高比

---

### US-2: 作为用户，我希望用纯文本生成视频
**优先级：** P0 (必须)

**场景：**
- 用户选择 "Text to Video" 模式
- 选择 Veo 3.1 Fast 模型
- 输入提示词："A cinematic drone shot of a waterfall"
- 点击生成按钮

**验收标准：**
1. 系统调用 KIE API 的 `TEXT_2_VIDEO` 模式
2. 返回 taskId 并开始轮询状态
3. 生成成功后显示视频预览
4. 扣除 100 积分

---

### US-3: 作为用户，我希望用单张图片生成视频
**优先级：** P0 (必须)

**场景：**
- 用户选择 "Image to Video" 模式
- 选择 "Single Image" 子模式
- 上传一张图片（风景照）
- 输入提示词："Camera slowly zooms in"
- 点击生成按钮

**验收标准：**
1. 图片上传成功（支持 PNG/JPEG/WEBP，最大 10MB）
2. 图片转换为 Base64 并上传到 KIE 获取 URL
3. 系统调用 KIE API 的 `IMAGE_2_VIDEO` 模式（需要补充实现）
4. 生成成功后显示视频预览

---

### US-4: 作为用户，我希望用首尾帧生成视频
**优先级：** P1 (重要)

**场景：**
- 用户选择 "Image to Video" 模式
- 选择 "Start & End Frames" 子模式
- 上传开始帧（人物站立）
- 上传结束帧（人物跳跃）
- 输入提示词："Person jumps into the air"
- 点击生成按钮

**验收标准：**
1. 支持上传两张图片（开始帧和结束帧）
2. 系统调用 KIE API 的 `FIRST_AND_LAST_FRAMES_2_VIDEO` 模式
3. 生成的视频从开始帧平滑过渡到结束帧
4. 支持 16:9 和 9:16 宽高比

---

### US-5: 作为用户，我希望用参考图生成视频
**优先级：** P1 (重要)

**场景：**
- 用户选择 "Image to Video" 模式
- 选择 "Reference Images" 子模式
- 上传 1-3 张参考图（风格参考）
- 输入提示词："A cinematic scene in this style"
- 点击生成按钮

**验收标准：**
1. 支持上传 1-3 张参考图
2. 系统调用 KIE API 的 `REFERENCE_2_VIDEO` 模式
3. 仅支持 16:9 宽高比（API 限制）
4. 生成的视频风格参考上传的图片

---

### US-6: 作为用户，我希望看到生成进度和预估时间
**优先级：** P2 (可选)

**场景：**
- 用户点击生成按钮后
- 系统显示 "Generating..." 状态
- 显示预估时间："约 3-5 分钟"
- 显示轮询进度（第 X 次检查）

**验收标准：**
1. 生成按钮变为加载状态
2. 显示友好的等待提示
3. 每 15 秒轮询一次状态
4. 最多轮询 60 次（15 分钟超时）

---

### US-7: 作为用户，我希望在积分不足时收到提示
**优先级：** P0 (必须)

**场景：**
- 用户当前积分：50
- 选择 Veo 3.1 Fast（需要 100 积分）
- 点击生成按钮

**验收标准：**
1. 生成按钮被禁用
2. 显示红色提示："积分不足，需要 100 积分"
3. 提供 "购买积分" 链接
4. 不调用 API，不扣除积分

---

## 3. 功能需求

### FR-1: 模型配置
- 在 `config/models.ts` 中添加 Veo 3.1 Fast 模型配置
- 包含：id, name, provider, description, credits, capabilities

### FR-2: 类型定义
- 在 `lib/kie/types.ts` 中补充 `IMAGE_2_VIDEO` 类型
- 确保 `Veo3GenerateRequest` 接口完整

### FR-3: KIE Client 方法
- 确认 `generateVeo3Video()` 支持所有 4 种模式
- 确认 `waitForVeo3Completion()` 正确解析结果

### FR-4: API 路由
- 扩展 `/api/kie/video` 支持 Veo 3.1
- 实现参数转换逻辑（前端参数 → KIE API 参数）
- 实现图片上传逻辑（Base64 → KIE URL）

### FR-5: 前端组件
- `VideoGenerationPage.tsx`: 添加 Veo 3.1 参数限制
- `VideoParameterPanel.tsx`: 禁用不支持的选项
- `VideoModelSelector.tsx`: 显示 Veo 3.1 模型

### FR-6: 积分计算
- 在 `lib/kie/credits.ts` 中确认 Veo 3.1 固定 100 积分
- 在前端显示正确的积分消耗

---

## 4. 非功能需求

### NFR-1: 性能
- 图片上传响应时间 < 3 秒
- API 调用响应时间 < 5 秒
- 轮询间隔：15 秒

### NFR-2: 可用性
- 清晰提示 Veo 3.1 的限制（固定 720p/8s）
- 图片上传支持拖拽
- 错误提示友好且可操作

### NFR-3: 兼容性
- 支持 Chrome, Firefox, Safari, Edge 最新版本
- 移动端响应式布局

### NFR-4: 安全性
- 图片大小限制：10MB
- 图片格式限制：PNG, JPEG, WEBP
- API Key 不暴露到前端

---

## 5. 约束条件

### 技术约束
- 必须使用现有的 KIE Client 架构
- 必须兼容现有的 Sora 2 实现
- 必须使用 TypeScript 严格模式

### API 约束
- Veo 3.1 Fast 固定 720p/8s，不可自定义
- Reference 模式仅支持 16:9
- 图片必须先上传到 KIE 获取 URL

### 业务约束
- 固定 100 积分/次
- 积分不足时不允许生成
- 生成失败时自动退款

---

## 6. 验收标准总结

### 必须满足 (P0)
- [ ] 用户可以选择 Veo 3.1 Fast 模型
- [ ] 支持文本生成视频 (TEXT_2_VIDEO)
- [ ] 支持单图生成视频 (IMAGE_2_VIDEO)
- [ ] 积分不足时正确拦截
- [ ] 生成成功后显示视频预览
- [ ] 生成失败时自动退款

### 重要功能 (P1)
- [ ] 支持首尾帧生成视频 (FIRST_AND_LAST_FRAMES_2_VIDEO)
- [ ] 支持参考图生成视频 (REFERENCE_2_VIDEO)
- [ ] 图片上传验证（格式、大小）

### 可选功能 (P2)
- [ ] 显示生成进度和预估时间
- [ ] 图片拖拽上传
- [ ] 生成历史记录

---

## 7. 风险与依赖

### 风险
- **R1**: KIE API 的 `IMAGE_2_VIDEO` 模式可能未完全支持
  - **缓解措施**: 先实现 TEXT_2_VIDEO，再逐步添加图片模式
  
- **R2**: 图片上传到 KIE 可能失败
  - **缓解措施**: 添加重试机制和友好错误提示

### 依赖
- **D1**: KIE API Key 必须有效且有足够配额
- **D2**: 用户必须有足够积分
- **D3**: 图片上传服务 (kieai.redpandaai.co) 必须可用

---

## 8. 国际化需求

需要添加以下翻译 key（在 `i18n/messages/{locale}/NanoBananaVideo.json`）：

```json
{
  "VideoGeneration": {
    "models": {
      "veo31Fast": "Veo 3.1 Fast (Google)",
      "veo31FastDesc": "Fast video generation, 720p/8s, 100 credits"
    },
    "limitations": {
      "veo31Fixed": "Veo 3.1 Fast: Fixed 720p resolution, 8 seconds duration",
      "referenceOnly169": "Reference mode only supports 16:9 aspect ratio"
    }
  }
}
```

---

## 9. 下一步

1. ✅ 完成 Requirements.md（本文档）
2. ⏭️ 创建 Design.md（技术设计文档）
3. ⏭️ 创建 Tasks.md（任务分解清单）
4. ⏭️ 开始实现代码

---

**文档版本**: v1.0  
**创建日期**: 2026-02-09  
**作者**: AI Assistant  
**审核状态**: 待审核
