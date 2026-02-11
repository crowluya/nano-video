# Veo 3.1 Fast 用户使用指南

## 🎬 什么是 Veo 3.1 Fast？

Veo 3.1 Fast 是 Google 推出的高性价比视频生成模型，具有以下特点：

- ⚡ **快速生成**：约 3-5 分钟完成
- 💰 **价格透明**：固定 100 积分/次
- 🎥 **固定规格**：720p 分辨率，8 秒时长
- 🎨 **多种模式**：支持文本、图片、首尾帧、参考图生成

---

## 📋 支持的生成模式

### 1. 文本生成视频 (Text-to-Video)
**适用场景**：从零开始创作视频

**使用方法**：
1. 选择 "Text to Video" 模式
2. 选择 "Veo 3.1 Fast" 模型
3. 输入详细的提示词
4. 选择宽高比（16:9 或 9:16）
5. 点击生成

**示例提示词**：
```
A cinematic drone shot flying over a misty mountain range at sunrise, 
with golden light breaking through the clouds, smooth camera movement
```

---

### 2. 单图生成视频 (Image-to-Video)
**适用场景**：让静态图片动起来

**使用方法**：
1. 选择 "Image to Video" 模式
2. 选择 "Single Image" 子模式
3. 上传 1 张图片（最大 10MB）
4. 输入运动描述提示词
5. 点击生成

**示例提示词**：
```
Camera slowly zooms in on the subject, 
with subtle parallax effect on the background
```

**图片要求**：
- 格式：PNG, JPEG, WEBP
- 大小：最大 10MB
- 建议分辨率：1920x1080 或更高

---

### 3. 首尾帧生成视频 (Start & End Frames)
**适用场景**：控制视频的开始和结束画面

**使用方法**：
1. 选择 "Image to Video" 模式
2. 选择 "Start & End Frames" 子模式
3. 上传开始帧图片
4. 上传结束帧图片
5. 输入过渡描述提示词
6. 点击生成

**示例提示词**：
```
Smooth transition from standing to jumping, 
with natural body movement and motion blur
```

**注意事项**：
- 必须上传恰好 2 张图片
- 两张图片的宽高比应该一致
- 建议使用相似场景的图片

---

### 4. 参考图生成视频 (Reference Images)
**适用场景**：根据参考图的风格生成视频

**使用方法**：
1. 选择 "Image to Video" 模式
2. 选择 "Reference Images" 子模式
3. 上传 1-4 张参考图
4. **必须选择 16:9 宽高比**（API 限制）
5. 输入场景描述提示词
6. 点击生成

**示例提示词**：
```
A cinematic scene in this artistic style, 
with similar lighting and color grading
```

**重要限制**：
- ⚠️ 仅支持 16:9 宽高比
- 可上传 1-4 张参考图
- 参考图用于风格参考，不会直接出现在视频中

---

## 💡 提示词编写技巧

### 好的提示词特征
✅ **具体描述**：详细描述场景、动作、光线  
✅ **运动方向**：说明相机运动或物体运动  
✅ **风格指定**：电影感、纪录片风格等  
✅ **时间信息**：日出、黄昏、夜晚等  

### 示例对比

❌ **不好的提示词**：
```
A person walking
```

✅ **好的提示词**：
```
A person walking through a misty forest at dawn, 
cinematic tracking shot following from behind, 
soft golden light filtering through trees, 
slow and steady camera movement
```

---

## 🎨 宽高比选择指南

### 16:9 (横屏)
- 适合：风景、电影、桌面观看
- 推荐场景：自然风光、城市景观、宽幅场景

### 9:16 (竖屏)
- 适合：手机观看、社交媒体、人物特写
- 推荐场景：人物视频、产品展示、短视频

---

## ⚙️ 参数说明

### 固定参数（不可修改）
- **分辨率**：720p（1280x720 或 720x1280）
- **时长**：8 秒
- **帧率**：24fps
- **积分消耗**：100 积分/次

### 可选参数
- **宽高比**：16:9 或 9:16
- **提示词**：最多 500 字符
- **图片**：根据模式上传 0-4 张

---

## 💰 积分消耗

### 计费规则
- 每次生成固定消耗 **100 积分**
- 无论成功或失败，都会先扣除积分
- **生成失败时自动退款**

### 积分检查
- 生成前系统会自动检查积分余额
- 积分不足时生成按钮会被禁用
- 点击 "Get More Credits" 可购买积分

---

## ⏱️ 生成时间

### 预计时间
- **正常情况**：3-5 分钟
- **高峰期**：5-10 分钟
- **最长等待**：15 分钟（超时自动退款）

### 状态说明
- **Queued**：任务已提交，等待处理
- **Processing**：正在生成中
- **Completed**：生成完成
- **Failed**：生成失败（自动退款）

---

## ❌ 常见错误及解决方案

### 1. "Insufficient credits"
**原因**：积分不足  
**解决**：购买更多积分或等待订阅积分刷新

### 2. "IMAGE_2_VIDEO mode requires exactly 1 image"
**原因**：单图模式上传了多张图片  
**解决**：只上传 1 张图片，或切换到其他模式

### 3. "REFERENCE_2_VIDEO mode only supports 16:9 aspect ratio"
**原因**：参考图模式选择了 9:16  
**解决**：切换到 16:9 宽高比

### 4. "File size exceeds 10MB limit"
**原因**：图片文件过大  
**解决**：压缩图片或使用更小的图片

### 5. "Generation timeout"
**原因**：生成时间超过 15 分钟  
**解决**：积分已自动退款，请重试

---

## 🎯 最佳实践

### 提示词优化
1. **使用电影术语**：tracking shot, drone shot, close-up
2. **描述光线**：golden hour, soft lighting, dramatic shadows
3. **指定运动**：slow pan, zoom in, camera follows
4. **添加细节**：misty, vibrant colors, smooth movement

### 图片准备
1. **高质量图片**：使用高分辨率图片（1920x1080+）
2. **清晰主体**：确保主体清晰，避免模糊
3. **合适构图**：考虑视频的宽高比
4. **一致风格**：多张图片使用相似的风格

### 模式选择
- **创意探索** → Text-to-Video
- **图片动画** → Image-to-Video
- **精确控制** → Start & End Frames
- **风格迁移** → Reference Images

---

## 📊 与 Sora 2 对比

| 特性 | Veo 3.1 Fast | Sora 2 Fast | Sora 2 Pro |
|------|--------------|-------------|------------|
| 分辨率 | 720p (固定) | 720p (固定) | 720p/1080p |
| 时长 | 8s (固定) | 10s/15s | 10s/15s |
| 积分 | 100 | 80-120 | 150-600 |
| 生成时间 | 3-5 分钟 | 5-8 分钟 | 10-15 分钟 |
| 图片模式 | 4 种 | 2 种 | 2 种 |

### 选择建议
- **追求性价比** → Veo 3.1 Fast
- **需要更长时长** → Sora 2
- **需要高分辨率** → Sora 2 Pro

---

## 🔧 故障排查

### 生成失败
1. 检查提示词是否包含敏感内容
2. 检查图片是否符合要求
3. 检查网络连接
4. 查看错误提示信息

### 视频质量不佳
1. 使用更详细的提示词
2. 提供更高质量的输入图片
3. 尝试不同的宽高比
4. 调整提示词中的运动描述

### 积分未退款
1. 等待 1-2 分钟（退款可能有延迟）
2. 刷新页面查看积分余额
3. 查看积分日志
4. 联系客服

---

## 📞 获取帮助

### 文档资源
- [KIE API 文档](.dev/KIE_API_DOCUMENTATION.md)
- [需求文档](.kiro/specs/veo-3-1-integration/requirements.md)
- [测试指南](.kiro/specs/veo-3-1-integration/test-veo3-api.md)

### 技术支持
- 提交 Issue 到 GitHub
- 发送邮件到 support@example.com
- 加入 Discord 社区

---

## 🎉 开始创作

现在你已经了解了 Veo 3.1 Fast 的所有功能，开始创作你的第一个视频吧！

**快速开始步骤**：
1. 访问视频生成页面
2. 选择 Veo 3.1 Fast 模型
3. 输入提示词或上传图片
4. 点击生成按钮
5. 等待 3-5 分钟
6. 下载你的视频！

祝你创作愉快！🎬✨
