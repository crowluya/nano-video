# Nano Banana Video - 上线前需求澄清

> 基于 Nexty.dev 模板改造的 AI 视频生成 SaaS

---

## 一、项目现状

### ✅ 已完成的改造

| 模块 | 状态 | 说明 |
|------|------|------|
| **品牌定制** | ✅ | 改名为 Nano Banana Video |
| **首页** | ✅ | 自定义 Hero/Features/FAQ/CTA/UseCases |
| **视频生成** | ✅ | 集成 kie.ai (Sora 2, Veo 3.1) |
| **图片生成** | ✅ | 集成 kie.ai (Nano Banana, MJ, Flux) |
| **音乐生成** | ✅ | 集成 kie.ai (Suno) |
| **Prompt 生成器** | ✅ | AI 辅助生成视频 prompt |
| **分镜 Prompt** | ✅ | 图片生成分镜描述 |
| **Remotion 剪辑** | ✅ | 浏览器端视频编辑组件 |
| **Dashboard 页面** | ✅ | video-gen/image-gen/music-gen/studio |
| **支付系统** | ✅ | Stripe + Creem 双网关 |
| **i18n** | ✅ | en/zh/ja 三语言 |
| **认证** | ✅ | Better Auth (Google/GitHub/Magic Link) |
| **存储** | ✅ | Cloudflare R2 |
| **邮件** | ✅ | Resend |

### 📁 项目结构

```
app/
├── [locale]/(basic-layout)/
│   ├── page.tsx                    # 首页 (NanoBananaVideo)
│   ├── video-generation/           # 视频生成落地页
│   ├── prompt-generator/           # Prompt 生成器
│   ├── nanabananvideo/             # 产品页
│   ├── login/                      # 登录
│   ├── blog/                       # 博客
│   └── ...
│
├── [locale]/(protected)/dashboard/
│   ├── video-gen/                  # 视频生成
│   ├── image-gen/                  # 图片生成
│   ├── music-gen/                  # 音乐生成
│   ├── studio/                     # 一体化工作台
│   ├── (admin)/                    # 管理后台
│   └── (user)/                     # 用户中心
│
└── api/
    ├── kie/                        # kie.ai API
    │   ├── image/
    │   ├── video/
    │   ├── music/
    │   ├── status/
    │   ├── upload/
    │   └── save-to-r2/
    ├── stripe/webhook/
    ├── creem/webhook/
    └── ai-demo/                    # AI 演示
```

---

## 二、上线前必须确认的问题

### 1. 域名与部署

| 问题 | 你的回答 |
|------|----------|
| 正式域名是什么？ | |
| 域名是否已备案（如需）？ | |
| 部署平台选择？(Vercel/自建/其他) | |
| 数据库选择？(Neon/Supabase/自建 PG) | |
| CDN 配置？ | |

### 2. 支付配置

| 问题 | 你的回答 |
|------|----------|
| Stripe 账号是否已激活？ | |
| Stripe 是否已完成企业认证？ | |
| 是否需要 Creem？还是只用 Stripe？ | |
| 定价方案确定了吗？（月付/年付/一次性） | |
| 免费试用积分数量？ | |
| 各功能积分消耗确定了吗？ | |

**当前积分配置参考**（需确认）：

| 功能 | 积分消耗 |
|------|----------|
| 视频生成 (Sora 2) | ? |
| 视频生成 (Veo 3.1) | ? |
| 图片生成 (Nano Banana) | ? |
| 图片生成 (Midjourney) | ? |
| 音乐生成 (Suno) | ? |

### 3. AI 服务配置

| 问题 | 你的回答 |
|------|----------|
| kie.ai 账号是否已充值？ | |
| kie.ai API 额度是否充足？ | |
| 是否需要 OpenAI API？ | |
| 是否需要 Anthropic API？ | |
| 是否需要 Google AI API？ | |
| Prompt 生成器用哪个模型？ | |

### 4. 功能范围

| 功能 | 上线状态 | 备注 |
|------|----------|------|
| 视频生成 | ⬜ 上线 / ⬜ 隐藏 | |
| 图片生成 | ⬜ 上线 / ⬜ 隐藏 | |
| 音乐生成 | ⬜ 上线 / ⬜ 隐藏 | |
| Prompt 生成器 | ⬜ 上线 / ⬜ 隐藏 | |
| Remotion 剪辑 | ⬜ 上线 / ⬜ Beta / ⬜ 隐藏 | |
| Studio 一体化 | ⬜ 上线 / ⬜ Beta / ⬜ 隐藏 | |
| Blog/CMS | ⬜ 需要 / ⬜ 不需要 | |

### 5. 用户体系

| 问题 | 你的回答 |
|------|----------|
| 是否需要邮箱验证？ | |
| 是否支持 Google 登录？ | |
| 是否支持 GitHub 登录？ | |
| 是否支持 Magic Link？ | |
| 新用户免费积分数量？ | |
| 是否需要邀请码/推荐系统？ | |

### 6. 品牌与内容

| 问题 | 你的回答 |
|------|----------|
| Logo 是否已准备？ | |
| Favicon 是否已准备？ | |
| OG 图片（社交分享）是否已准备？ | |
| 社交媒体链接？(Twitter/Discord/etc) | |
| 客服/支持渠道？ | |
| 隐私政策/服务条款是否已准备？ | |

---

## 三、已发现的待修复问题

### 🔴 高优先级

1. **占位图片未替换**
   - 位置：`i18n/messages/*/NanoBananaVideo.json`
   - 问题：Features 和 UseCases 使用 `/placeholder.webp`
   - 需要：替换为实际产品截图

2. **社交链接为空**
   - 位置：`config/site.ts`
   - 问题：`GITHUB_URL`, `TWITTER_URL` 等为空字符串
   - 需要：填写或移除

3. **环境变量检查**
   - 需要确认所有必要的 API keys 已配置
   - 需要确认 Webhook secrets 已设置

### 🟡 中优先级

4. **视频生成历史**
   - 需要确认：用户能否查看/管理生成历史？
   - 需要确认：R2 永久存储流程是否完整？

5. **错误处理**
   - 需要检查：API 失败时的用户提示
   - 需要检查：积分不足时的引导流程

6. **SEO 配置**
   - 需要检查：各页面 metadata
   - 需要检查：sitemap.xml 生成
   - 需要检查：robots.txt

### 🟢 低优先级

7. **用户引导**
   - 可选：新用户 Onboarding 流程
   - 可选：功能介绍 Tour

8. **性能优化**
   - 可选：图片懒加载
   - 可选：Bundle 分析优化

---

## 四、技术检查清单

### 环境变量清单

```bash
# 核心
DATABASE_URL=
NEXT_PUBLIC_SITE_URL=

# 认证
BETTER_AUTH_SECRET=
NEXT_PUBLIC_BETTER_AUTH_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# 支付
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CREEM_API_KEY=
CREEM_WEBHOOK_SECRET=

# AI 服务
KIE_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=

# 存储
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# 邮件
RESEND_API_KEY=
ADMIN_EMAIL=

# 可选
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=
```

### Webhook 端点

| 服务 | 端点 | 状态 |
|------|------|------|
| Stripe | `/api/stripe/webhook` | ⬜ 待配置 |
| Creem | `/api/creem/webhook` | ⬜ 待配置 |

---

## 五、下一步行动

请填写上述问题后，我将：

1. 生成精确的**上线检查清单**
2. 创建**待办任务列表**（tasks.md）
3. 帮助执行具体的修复工作
4. 使用 Playwright MCP 进行 E2E 测试

---

*文档生成时间：2025-01-13*
*基于：Nexty.dev v3.x + Nano Banana Video 定制*
