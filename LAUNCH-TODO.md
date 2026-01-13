# Nano Banana Video - 上线待办事项

> 生成时间：2025-01-13
> 域名：nanobananavideo.net
> 部署平台：Vercel
> 数据库：Supabase PostgreSQL

---

## 一、已确认配置

### 域名与部署
- [x] 域名：nanobananavideo.net
- [x] 部署平台：Vercel
- [x] 数据库：Supabase PostgreSQL
- [x] 环境变量：已配置

### 支付配置
- [x] Stripe：已配置激活
- [x] 定价方案：已配置（见下方修复项）
- [x] 新用户免费积分：80 积分

### AI 服务
- [x] kie.ai：已充值，额度充足
- [x] Prompt 生成器模型：已配置（Gemini 2.5 Flash Lite / DeepSeek）

### 功能范围
| 功能 | 状态 |
|------|------|
| 视频生成 | ✅ 上线 |
| 图片生成 | ✅ 上线 |
| Prompt 生成器 | ✅ 上线 |
| Blog | ✅ 上线 |
| 音乐生成 | ❌ 隐藏 |
| Remotion 剪辑 | ❌ 隐藏 |
| Studio 一体化 | ❌ 隐藏 |

### 用户体系
- [x] 登录方式：仅 Google 登录
- [x] 新用户积分：80
- [x] 邀请码/推荐系统：暂不需要

### 积分消耗配置（已确认）

**图片生成：**
| 模型 | 积分 |
|------|------|
| Nano Banana | 15 |
| Nano Banana Edit | 8 |
| Nano Banana Pro | 15 |
| Z-Image | 8 |
| Midjourney | 15 |
| Flux Kontext Pro | 10 |
| Flux Kontext Max | 15 |
| GPT-4o Image | 10 |

**视频生成：**
| 模型 | 积分 |
|------|------|
| Sora 2 Fast (720p 10s) | 80 |
| Sora 2 Fast (720p 15s) | 120 |
| Sora 2 Pro (720p 10s) | 150 |
| Sora 2 Pro (720p 15s) | 300 |
| Sora 2 Pro (1080p 10s) | 300 |
| Sora 2 Pro (1080p 15s) | 600 |
| Veo 3.1 | 100 |

**音乐生成（隐藏但保留配置）：**
| 模型 | 积分 |
|------|------|
| Suno V3.5 | 15 |
| Suno V4 | 20 |
| Suno V4.5 | 25 |
| Suno V4.5 Plus | 30 |
| Suno V5 | 35 |

---

## 二、待修复问题

### 🔴 P0 - 数据修复（阻塞上线）

- [ ] **FIX-001**: 修复 "Stande Plan" 拼写错误 → "Standard Plan"
  - 位置：数据库 `pricing_plans` 表
  - 影响：月度和年度套餐名称显示

- [ ] **FIX-002**: 修复 Standard Plan 积分错误
  - 当前值：110,000
  - 正确值：11,000
  - 位置：数据库 `pricing_plans.benefits_jsonb`

- [ ] **FIX-003**: 确认图片生成积分配置
  - config/models.ts 中 Nano Banana 是 5，但 UI 显示 15
  - 需要统一配置

### 🔴 P0 - 功能隐藏（阻塞上线）

- [ ] **HIDE-001**: 隐藏音乐生成入口
  - Dashboard 侧边栏
  - 首页（如有）

- [ ] **HIDE-002**: 隐藏 Remotion 剪辑入口
  - Dashboard 侧边栏

- [ ] **HIDE-003**: 隐藏 Studio 一体化入口
  - Dashboard 侧边栏

- [ ] **HIDE-004**: 隐藏 Creem 支付相关
  - 定价页面不显示 Creem 套餐
  - 或设置 `is_active: false`

### 🔴 P0 - 登录配置（阻塞上线）

- [ ] **AUTH-001**: 只保留 Google 登录
  - 隐藏 GitHub 登录按钮
  - 隐藏 Magic Link 登录选项

---

## 三、待准备内容

### 🟡 P1 - 品牌资源

- [ ] **BRAND-001**: 准备 Logo
  - 格式：SVG / PNG
  - 尺寸：建议 200x50 或类似

- [ ] **BRAND-002**: 准备 Favicon
  - 格式：ICO / PNG
  - 尺寸：16x16, 32x32, 180x180 (Apple Touch)

- [ ] **BRAND-003**: 准备 OG 图片（社交分享）
  - 格式：PNG / JPG
  - 尺寸：1200x630

- [ ] **BRAND-004**: 替换占位图片
  - 位置：`i18n/messages/*/NanoBananaVideo.json`
  - Features 和 UseCases 使用 `/placeholder.webp`

### 🟡 P1 - 社交与支持

- [ ] **SOCIAL-001**: 配置社交媒体链接
  - 位置：`config/site.ts`
  - Discord: ✅ 已有 `https://discord.com/invite/R7bUxWKRqZ`
  - Twitter/X: 待填写
  - GitHub: 待填写或移除

- [ ] **SOCIAL-002**: 配置客服/支持渠道
  - 支持邮箱
  - Discord 支持频道

### 🟡 P1 - 法律文档

- [ ] **LEGAL-001**: 准备/检查隐私政策内容
  - 路径：`/privacy-policy`

- [ ] **LEGAL-002**: 准备/检查服务条款内容
  - 路径：`/terms-of-service`

- [ ] **LEGAL-003**: 准备/检查退款政策内容
  - 路径：`/refund-policy`

---

## 四、技术检查清单

### 环境变量确认

```bash
# 核心
DATABASE_URL=                    # ✅ Supabase
NEXT_PUBLIC_SITE_URL=            # ⬜ 需确认是否为 nanobananavideo.net

# 认证
BETTER_AUTH_SECRET=              # ⬜ 待确认
NEXT_PUBLIC_GOOGLE_CLIENT_ID=    # ⬜ 待确认
GOOGLE_CLIENT_SECRET=            # ⬜ 待确认

# 支付
STRIPE_SECRET_KEY=               # ✅ 已配置
STRIPE_WEBHOOK_SECRET=           # ⬜ 待确认

# AI 服务
KIE_API_KEY=                     # ✅ 已配置

# 存储
R2_ACCOUNT_ID=                   # ⬜ 待确认
R2_ACCESS_KEY_ID=                # ⬜ 待确认
R2_SECRET_ACCESS_KEY=            # ⬜ 待确认
R2_BUCKET_NAME=                  # ⬜ 待确认
R2_PUBLIC_URL=                   # ⬜ 待确认

# 邮件
RESEND_API_KEY=                  # ⬜ 待确认
```

### Webhook 配置

| 服务 | 端点 | 状态 |
|------|------|------|
| Stripe | `https://nanobananavideo.net/api/stripe/webhook` | ⬜ 待配置 |

### 部署前检查

- [ ] `pnpm lint` 无错误
- [ ] `pnpm build` 构建成功
- [ ] 三语言切换正常 (en/zh/ja)
- [ ] Google 登录流程正常
- [ ] 支付流程正常（测试模式）
- [ ] 视频生成流程正常
- [ ] 图片生成流程正常

---

## 五、执行顺序建议

### 第一批：数据修复
1. FIX-001, FIX-002, FIX-003

### 第二批：功能隐藏
2. HIDE-001, HIDE-002, HIDE-003, HIDE-004
3. AUTH-001

### 第三批：品牌内容（可并行准备）
4. BRAND-001 ~ BRAND-004
5. SOCIAL-001, SOCIAL-002
6. LEGAL-001 ~ LEGAL-003

### 第四批：最终验证
7. 环境变量检查
8. Webhook 配置
9. 部署前检查

---

*文档生成时间：2025-01-13*
