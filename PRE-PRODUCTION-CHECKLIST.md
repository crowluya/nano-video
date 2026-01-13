# Nano Banana Video - 上线前检查清单

> 基于 AI 原生开发工作流 + .cursor/rules 规范的上线前准备

---

## 目录

- [一、功能完整性检查](#一功能完整性检查)
- [二、E2E 测试方案（Playwright MCP）](#二e2e-测试方案playwright-mcp)
- [三、性能优化检查](#三性能优化检查)
- [四、安全检查](#四安全检查)
- [五、部署准备](#五部署准备)
- [六、AI 工作流整合](#六ai-工作流整合)

---

## 一、功能完整性检查

### 1.1 核心功能模块

| 模块 | 功能 | 状态 | 说明 |
|------|------|------|------|
| **认证系统** | Better Auth + Google/GitHub | ⬜ | 登录/注册/OAuth流程 |
| **支付系统** | Stripe + Creem 双网关 | ⬜ | 充值/订阅/webhook |
| **积分系统** | credit-manager | ⬜ | 扣费/充值/退款 |
| **AI 聊天** | OpenRouter 多模型 | ⬜ | 对话/流式输出 |
| **图像生成** | kie.ai 4 模型 | ⬜ | NB/MJ/Flux/GPT-4o |
| **视频生成** | Sora 2 / Veo 3.1 | ⬜ | 文生视频/图生视频 |
| **音乐生成** | Suno V3.5-V5 | ⬜ | 文生音乐/延长 |
| **视频剪辑** | Remotion 浏览器端 | ⬜ | 时间线/导出 |
| **存储服务** | Cloudflare R2 | ⬜ | 上传/下载/预签名 |
| **邮件服务** | Resend | ⬜ | 验证/通知/发票 |

### 1.2 国际化 (i18n) 检查

```bash
# 检查翻译完整性
/find_missing_i18n.sh
```

| 语言 | 覆盖率 | 缺失 key |
|------|--------|----------|
| en (English) | ⬜ % | - |
| zh (中文) | ⬜ % | - |
| ja (日本語) | ⬜ % | - |

**检查命令**：`/i18n-check app/`

### 1.3 页面路由检查

| 路由 | 状态 | 备注 |
|------|------|------|
| `/` (首页) | ⬜ | Hero + Features + FAQ |
| `/login` | ⬜ | 登录页 |
| `/dashboard` | ⬜ | 控制台首页 |
| `/dashboard/chat` | ⬜ | AI 聊天 |
| `/dashboard/image` | ⬜ | 图像生成 |
| `/dashboard/video` | ⬜ | 视频生成 |
| `/dashboard/music` | ⬜ | 音乐生成 |
| `/dashboard/editor` | ⬜ | 视频剪辑 |
| `/dashboard/studio` | ⬜ | 一体化工作流 |
| `/dashboard/subscription` | ⬜ | 订阅管理 |
| `/dashboard/credits` | ⬜ | 积分历史 |

---

## 二、E2E 测试方案（Playwright MCP）

### 2.1 测试架构

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E 测试分层架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: 冒烟测试 (Smoke Tests)                            │
│  • 首页可访问                                                │
│  • 登录流程正常                                              │
│  • 关键页面可加载                                            │
│                           ↓                                  │
│  Layer 2: 功能测试 (Feature Tests)                           │
│  • 支付流程                                                  │
│  • AI 生成任务                                              │
│  • 文件上传/下载                                             │
│                           ↓                                  │
│  Layer 3: 集成测试 (Integration Tests)                      │
│  • 完整创作流程 (Chat → Image → Video → Export)             │
│  • 积分扣除流程                                              │
│  • Webhook 处理                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 测试脚本仓库

**目录结构**：
```
tests/
├── e2e/
│   ├── smoke/
│   │   ├── 01-homepage.spec.md
│   │   ├── 02-auth.spec.md
│   │   └── 03-dashboard.spec.md
│   ├── features/
│   │   ├── 01-payment.spec.md
│   │   ├── 02-ai-chat.spec.md
│   │   ├── 03-image-generation.spec.md
│   │   ├── 04-video-generation.spec.md
│   │   ├── 05-music-generation.spec.md
│   │   └── 06-video-editor.spec.md
│   └── integration/
│       ├── 01-creation-flow.spec.md
│       ├── 02-credit-flow.spec.md
│       └── 03-webhook-flow.spec.md
└── fixtures/
    ├── users.json
    └── test-data.json
```

### 2.3 测试指令（基于 Playwright MCP）

**文件**: `.claude/commands/test-e2e.md`

```yaml
---
description: 执行 E2E 测试（使用 Playwright MCP）
argument-hint: <test_spec_file>
allowed-tools:
  - mcp__playwright__browser_*
  - Bash
  - Read
---

# E2E 测试指令

你是一位专业的 QA 工程师，负责执行端到端测试。

## 执行步骤

1. **读取测试规范**
   - 读取 `tests/e2e/$ARGUMENTS.spec.md`
   - 理解测试目标和步骤

2. **启动浏览器**
   ```bash
   browser_navigate(url="BASE_URL")
   ```

3. **执行测试用例**
   - 按照规范中的步骤执行
   - 使用 `browser_snapshot` 验证页面状态
   - 使用 `browser_click` / `browser_type` 进行交互
   - 使用 `browser_take_screenshot` 记录失败

4. **生成测试报告**
   - 测试用例名称
   - 执行结果（通过/失败）
   - 失败原因（如有）
   - 截图链接（失败时）

5. **清理资源**
   ```bash
   browser_close()
   ```

## 输出格式

### ✅ 测试通过
```
[✅ PASS] <测试用例名称>
- 执行时间: Xs
- 验证点: 全部通过
```

### ❌ 测试失败
```
[❌ FAIL] <测试用例名称>
- 失败步骤: 步骤描述
- 预期结果: ...
- 实际结果: ...
- 截图: screenshots/fail-<timestamp>.png
```
```

### 2.4 示例测试规范

**文件**: `tests/e2e/smoke/01-homepage.spec.md`

```markdown
# 首页冒烟测试

## 目标
验证首页可正常访问且核心元素存在

## 前置条件
- 环境变量 `TEST_BASE_URL` 已设置

## 测试步骤

1. **导航到首页**
   - url: `{TEST_BASE_URL}`
   - wait: 2000ms

2. **验证核心元素**
   - 快照: `browser_snapshot()`
   - 检查点:
     - [ ] Hero 标题存在
     - [ ] CTA 按钮存在
     - [ ] 导航菜单存在
     - [ ] Footer 存在

3. **验证多语言切换**
   - 点击: "语言选择器"
   - 点击: "日本語"
   - 验证: 页面文本变为日文

4. **验证响应式**
   - 调整: 375x667 (移动端)
   - 验证: 移动端导航显示
   - 调整: 1920x1080 (桌面)
   - 验证: 桌面导航显示

## 预期结果
所有检查点通过，无控制台错误
```

**文件**: `tests/e2e/features/01-payment.spec.md`

```markdown
# 支付流程测试

## 目标
验证用户可以完成充值并积分正确到账

## 前置条件
- 测试用户已登录
- Stripe 测试模式已启用

## 测试步骤

1. **导航到充值页面**
   - url: `{TEST_BASE_URL}/dashboard/credits`
   - wait: 页面加载完成

2. **选择充值金额**
   - 快照: 获取页面元素
   - 点击: "$10 套餐" 按钮

3. **选择支付方式**
   - 点击: "Stripe" 支付方式

4. **跳转到支付页面**
   - 验证: Stripe Checkout 页面加载
   - 输入: 测试卡号 `4242 4242 4242 4242`
   - 输入: 过期日期 `12/34`
   - 输入: CVC `123`
   - 点击: "Pay"

5. **验证支付结果**
   - 等待: 返回到应用
   - 验证: 积分余额更新
   - 验证: 订单记录存在

## 预期结果
- 支付成功
- 积分余额增加
- 订单状态为 "completed"
```

---

## 三、性能优化检查

### 3.1 Core Web Vitals 目标

| 指标 | 目标 | 当前 | 优化建议 |
|------|------|------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | ⬜ | 图片优化/预加载 |
| FID (First Input Delay) | < 100ms | ⬜ | JS 代码分割 |
| CLS (Cumulative Layout Shift) | < 0.1 | ⬜ | 尺寸预留 |
| INP (Interaction to Next Paint) | < 200ms | ⬜ | 事件处理优化 |

### 3.2 Bundle 分析

```bash
# 运行 bundle 分析
pnpm analyze

# 检查输出
# - 查找大型 chunk
# - 识别重复依赖
# - 发现 tree-shaking 机会
```

### 3.3 图片优化

根据 `.cursor/rules/01-nextjs-best-practices.mdc`：

- [ ] 所有 `<img>` 替换为 `next/image`
- [ ] 添加 `priority` 到首屏图片
- [ ] 配置 `remotePatterns` 包含 R2_PUBLIC_URL
- [ ] 使用正确的 `sizes` 属性

### 3.4 代码分割

```typescript
// 动态导入大型组件
const VideoEditor = dynamic(() => import('@/components/editor/VideoEditor'), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false, // 浏览器专用组件
});
```

---

## 四、安全检查

### 4.1 环境变量检查

根据 `.cursor/rules/12-env-variables.mdc`：

| 变量 | 必须 | 检查项 |
|------|------|--------|
| `DATABASE_URL` | ✅ | 非 localhost |
| `BETTER_AUTH_SECRET` | ✅ | 强随机值 |
| `STRIPE_SECRET_KEY` | ✅ | 以 `sk_` 开头 |
| `STRIPE_WEBHOOK_SECRET` | ✅ | 以 `whsec_` 开头 |
| `CREEM_API_KEY` | ✅ | 有效密钥 |
| `R2_*` | ✅ | 正确配置 |
| `RESEND_API_KEY` | ✅ | 有效密钥 |
| `*_API_KEY` (AI) | ✅ | 非 placeholder |

### 4.2 安全配置检查

根据 `.cursor/rules/14-security-logging.mdc`：

- [ ] `.env*` 文件在 `.gitignore` 中
- [ ] `.env.local` 不被提交
- [ ] `NEXT_PUBLIC_*` 前缀正确使用
- [ ] 敏感操作有 `isAdmin()` 检查
- [ ] API 输入用 `zod` 验证
- [ ] Webhook 签名验证启用

### 4.3 认证/授权检查

- [ ] Better Auth session 正确配置
- [ ] 受保护页面有 `getSession()` 检查
- [ ] 管理功能有 `isAdmin()` 检查
- [ ] API 路由有适当的权限控制
- [ ] CSRF 保护已启用

### 4.4 支付安全

根据 `.cursor/rules/09-payments.mdc`：

- [ ] Webhook 签名验证（Stripe + Creem）
- [ ] Idempotency 检查
- [ ] 订单去重逻辑
- [ ] 积分操作有事务保护
- [ ] 退款验证

---

## 五、部署准备

### 5.1 数据库准备

```bash
# 1. 生成迁移
pnpm db:generate

# 2. 检查迁移文件
# - lib/db/migrations/

# 3. 在生产环境执行
pnpm db:migrate

# 4. 验证 schema
pnpm db:studio
```

### 5.2 环境配置

**生产环境 `.env.production`**：

```bash
# === 基础配置 ===
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# === 数据库 ===
DATABASE_URL=postgresql://...

# === 认证 ===
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-domain.com
BETTER_AUTH_SECRET=<强随机值>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# === 支付 ===
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CREEM_API_KEY=...

# === 存储 ===
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://...

# === AI 服务 ===
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
KIE_API_KEY=...

# === 邮件 ===
RESEND_API_KEY=re_...
ADMIN_EMAIL=...
```

### 5.3 构建验证

```bash
# 1. 安装依赖
pnpm install --frozen-lockfile

# 2. 类型检查
pnpm tsc --noEmit

# 3. Lint 检查
pnpm lint

# 4. 构建生产版本
pnpm build

# 5. 验证构建输出
ls -la .next/
```

### 5.4 Webhook 配置

**Stripe Webhook 端点**：
```
https://your-domain.com/api/stripe/webhook
```

事件订阅：
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `charge.refunded`
- `radar.early_fraud_warning.created` (可选)

**Creem Webhook 端点**：
```
https://your-domain.com/api/creem/webhook
```

### 5.5 DNS & CDN 配置

- [ ] A 记录指向 Vercel/VPS IP
- [ ] CNAME 记录配置（如使用自定义域名）
- [ ] R2 自定义域名配置
- [ ] CDN 缓存策略配置

---

## 六、AI 工作流整合

### 6.1 将 .cursor/rules 整合到 Claude Code

**目标**：让 Claude Code 也能理解 `.cursor/rules` 中的规范

**方案**：创建一个统一的 Subagent

**文件**: `.claude/agents/cursor-rules-expert.md`

```yaml
---
name: cursor-rules-expert
description: 项目开发规范专家，负责解释 .cursor/rules 中的所有规则
tools:
  - Read
  - Glob
model: sonnet
---

# 项目开发规范专家

你是 Nano Banana Video 项目的开发规范专家。

## 规范文件位置

所有开发规范位于 `.cursor/rules/` 目录：

- `00-general-typescript.mdc` - TypeScript 规范
- `01-nextjs-best-practices.mdc` - Next.js 最佳实践
- `02-react-components.mdc` - React 组件规范
- `03-tailwind-css.mdc` - Tailwind CSS 规范
- `04-i18n-guidelines.mdc` - 国际化规范
- `05-project-structure.mdc` - 项目结构
- `06-ai-integration.mdc` - AI 集成
- `07-better-auth-drizzle.mdc` - 认证 + 数据库
- `08-api-data-handling.mdc` - API 数据处理
- `09-payments.mdc` - 支付系统（重要！）
- `10-cloudflare-r2.mdc` - R2 存储
- `11-resend-email.mdc` - 邮件服务
- `12-env-variables.mdc` - 环境变量
- `13-pnpm-scripts.mdc` - 脚本命令
- `14-security-logging.mdc` - 安全与日志

## 工作方式

1. 当被问到开发规范相关问题时，先读取对应的规则文件
2. 用简洁的语言解释规范要点
3. 提供代码示例
4. 指出常见错误

## 核心原则摘要

### TypeScript
- 禁止 `any`，使用 `unknown`
- 接口用 `interface`，联合用 `type`
- 显式返回类型

### Next.js
- 默认 Server Component
- 数据获取在 Server 端
- 使用 `next/link` 和 `next/image`

### React
- 函数组件 + Hooks
- Props 用 interface 定义
- 状态管理用 Zustand

### i18n
- 所有用户文本用翻译
- 服务端用 `getTranslations`
- 客户端用 `useTranslations`

### 安全
- 敏感信息用环境变量
- API 输入用 zod 验证
- 检查权限用 `isAdmin()`/`getSession()`
```

### 6.2 补充 Slash Commands

**`.claude/commands/check-deploy.md`**

```yaml
---
description: 上线前部署检查
model: opus
allowed-tools:
  - Read
  - Bash
  - Grep
---

# 部署前检查指令

## 执行检查

### 1. 环境变量检查
- [ ] 读取 `.env.example`
- [ ] 对比生产环境配置
- [ ] 报告缺失/错误的变量

### 2. 构建检查
```bash
!pnpm tsc --noEmit
!pnpm lint
!pnpm build
```

### 3. 数据库检查
```bash
!pnpm db:generate
# 检查是否有未应用的迁移
```

### 4. 代码质量
- 搜索硬编码的敏感信息
  ```bash
!grep -r "sk_live_" app/ --exclude-dir=node_modules
!grep -r "API_KEY" app/ --exclude-dir=node_modules
  ```

### 5. i18n 完整性
- 调用 `/i18n-check app/`

### 6. 依赖安全
```bash
!pnpm audit
```

## 输出报告

生成一份 Markdown 报告，包含：
- 检查项清单
- 发现的问题
- 修复建议
- 风险评级（高/中/低）
```

---

## 七、上线后监控

### 7.1 监控指标

| 指标 | 工具 | 预警阈值 |
|------|------|----------|
| 错误率 | Vercel Analytics | > 1% |
| 响应时间 | Vercel Analytics | > 1s |
| Uptime | UptimeRobot | < 99.9% |
| Webhook 失败 | 日志监控 | > 5次/小时 |
| 支付失败 | 日志监控 | > 10% |

### 7.2 日志关键事件

- 用户注册/登录
- 支付成功/失败
- AI 生成任务开始/完成/失败
- 积分变动
- Webhook 接收
- API 错误

### 7.3 回滚计划

```bash
# Vercel 回滚
vercel rollback

# 或切换到 Git 上一个稳定版本
git revert HEAD
git push
```

---

## 八、快速启动脚本

**文件**: `scripts/pre-deploy.sh`

```bash
#!/bin/bash
set -e

echo "🚀 开始上线前检查..."

# 1. 类型检查
echo "📝 TypeScript 类型检查..."
pnpm tsc --noEmit

# 2. Lint 检查
echo "🔍 ESLint 检查..."
pnpm lint

# 3. 测试
echo "🧪 运行测试..."
pnpm test

# 4. 构建
echo "📦 构建生产版本..."
pnpm build

# 5. 安全审计
echo "🔒 依赖安全审计..."
pnpm audit

echo "✅ 所有检查通过！可以部署了"
```

---

*生成时间: 2025-01-13*
*基于: AI-NATIVE-WORKFLOW.md + .cursor/rules/*
