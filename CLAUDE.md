# Nano Banana Video - AI 协作指南

> 本文件是 AI 长期记忆的核心，包含项目开发的所有关键信息和规范。

---

## 一、项目概览

### 基本信息
- **项目名称**: Nano Banana Video
- **域名**: nanobananavideo.net
- **技术栈**: Next.js 16 + React 19 + TypeScript
- **包管理器**: pnpm 10.x
- **数据库**: Supabase PostgreSQL + Drizzle ORM
- **认证**: better-auth (仅 Google 登录)
- **支付**: Stripe
- **AI 服务**: kie.ai
- **国际化**: next-intl (支持 en/zh/ja)
- **部署**: Vercel

### 功能范围
| 功能 | 状态 | 说明 |
|------|------|------|
| 视频生成 | ✅ 上线 | Sora 2, Veo 3.1 |
| 图片生成 | ✅ 上线 | Nano Banana, Midjourney, Flux 等 |
| Prompt 生成器 | ✅ 上线 | Gemini / DeepSeek |
| Blog | ✅ 上线 | - |
| 音乐生成 | ❌ 隐藏 | 后续开发 |
| Remotion 剪辑 | ❌ 隐藏 | 后续开发 |
| Studio 一体化 | ❌ 隐藏 | 后续开发 |

### 积分体系
- 新用户注册：80 积分
- 积分配置：`config/models.ts` 和 `lib/kie/credits.ts`

### 项目结构
```
app/
├── [locale]/              # 国际化路由
│   ├── (basic-layout)/    # 公开页面
│   │   ├── page.tsx       # 首页
│   │   ├── video-generation/
│   │   ├── prompt-generator/
│   │   └── nanabananvideo/
│   └── (protected)/       # 需要认证的页面
│       └── dashboard/
├── api/                   # API 路由
└── layout.tsx             # 根布局

components/
├── ui/                    # 基础 UI 组件 (shadcn/ui)
├── video-generation/      # 视频生成组件
├── prompt-generator/      # Prompt 生成器组件
├── image-generation/      # 图片生成组件
└── ...

i18n/
└── messages/              # 翻译文件
    ├── en/
    ├── zh/
    └── ja/

lib/                       # 工具函数和库
config/                    # 配置文件
└── ...
```

---

## 二、开发环境

### 运行命令
```bash
# 开发服务器
pnpm dev

# 构建
pnpm build

# 生产运行
pnpm start

# 代码检查
pnpm lint

# 数据库相关
pnpm db:generate    # 生成迁移文件
pnpm db:migrate     # 执行迁移
pnpm db:push        # 推送 schema 到数据库
pnpm db:studio      # 打开 Drizzle Studio
pnpm db:seed        # 填充种子数据
```

### 环境变量
关键环境变量参考 `.env.example`：
- 数据库连接
- AI 服务 API 密钥
- Stripe 密钥
- 认证密钥

---

## 三、开发规范

### TypeScript 规范
```typescript
// ✅ 正确：明确类型定义
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

// ❌ 错误：使用 any
function processData(data: any) { ... }

// ✅ 正确：使用 unknown
function processData(data: unknown) { ... }
```

### React/Next.js 规范
```typescript
// ✅ 默认使用 Server Component
export default function UserProfile() {
  return <div>...</div>;
}

// ✅ 需要交互时添加 'use client'
'use client';
export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 国际化规范
```typescript
// ✅ 正确：使用翻译
import { useTranslations } from 'next-intl';

export function Hero() {
  const t = useTranslations('Landing.hero');
  return <h1>{t('title')}</h1>;
}

// ❌ 错误：硬编码文本
export function Hero() {
  return <h1>Welcome to Nano Banana Video</h1>;
}
```

---

## 四、AI 协作指令

### 开发前
1. **阅读规范**：先阅读 `@constitution.md` 确保理解项目原则
2. **查看 spec**：如果有 `specs/` 目录下的 spec，严格按 spec 实现
3. **理解上下文**：使用 Grep/Glob 查找相关代码，理解现有实现

### 编码时
1. **优先标准库**：优先使用 Next.js/React 内置功能
2. **遵循规范**：确保 i18n、类型定义、组件结构符合规范
3. **渐进式实现**：从最小实现开始，逐步完善

### 提交前
1. **运行 lint**：`pnpm lint` 确保无错误
2. **测试变更**：验证功能是否正常工作
3. **检查 i18n**：确保所有文本都使用了翻译

---

## 五、浏览器操作规范

### Playwright MCP 优先
所有浏览器相关操作必须使用 Playwright MCP 工具：

| 工具 | 用途 |
|------|------|
| `browser_navigate` | 导航到 URL |
| `browser_snapshot` | 获取页面结构（推荐） |
| `browser_click` | 点击元素 |
| `browser_type` | 输入文本 |
| `browser_take_screenshot` | 截图 |
| `browser_close` | 关闭页面 |

### 标准流程
```
1. browser_navigate → 打开页面
2. browser_wait_for → 等待加载
3. browser_snapshot → 获取结构和 ref
4. browser_click/type → 执行交互
5. browser_close → 完成关闭
```

### 可用指令
- `/screenshot <url>` - 快速截图
- `/form-test <url>` - 测试表单
- 或使用 `playwright-browser` 子代理

---

## 六、Git 规范

### Conventional Commits
```
feat(video): add Sora model support
fix(auth): resolve session timeout issue
docs(readme): update installation guide
i18n(zh): add missing translations
refactor(player): extract video player component
test(api): add integration tests for webhook
```

### 分支保护
- `main` 分支禁止直接修改
- 使用 PR 进行代码合并
- PR 必须通过审查

---

## 七、常用代码模式

### 获取当前语言
```typescript
import { getLocale } from 'next-intl/server';

const locale = await getLocale(); // 'en' | 'zh' | 'ja'
```

### 服务端获取翻译
```typescript
import { getTranslations } from 'next-intl/server';

const t = await getTranslations('Landing.hero');
const title = t('title');
```

### API 路由错误处理
```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 处理逻辑
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Drizzle 查询
```typescript
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

const user = await db.query.users.findFirst({
  where: eq(users.email, email),
});
```

---

## 八、故障排查

### 构建错误
- 检查 TypeScript 类型错误
- 确保所有 imports 正确
- 检查环境变量配置

### i18n 相关
- 翻译缺失检查 `i18n/messages/{locale}/`
- 确保 key 在所有语言中都存在
- 检查 `next-intl` 配置

### 数据库相关
- 确保迁移已执行：`pnpm db:migrate`
- 检查 schema 同步：`pnpm db:push`
- 使用 Drizzle Studio 查看数据

---

## 九、扩展阅读

### Nexty.dev 模板文档

本项目基于 [NEXTY.DEV](https://nexty.dev) SaaS 模板开发。

**核心特性参考：**
- **认证**: Better-auth（Google/GitHub/Magic Link）
- **数据库**: Drizzle ORM + Supabase/Neon/Postgres
- **支付**: Stripe（月付/年付/一次性）
- **AI Demo**: Vercel AI SDK + OpenRouter + Replicate
- **可视化定价管理**: Admin 后台可视化创建/编辑定价方案
- **CMS**: 博客编辑状态、访问权限、AI 翻译
- **邮件订阅**: Resend + Cloudflare
- **文件存储**: Cloudflare R2
- **多语言**: i18n 国际化支持

**技术栈：**
| 技术 | 模块 |
|------|------|
| Next.js | React 全栈框架 |
| Tailwind CSS | 样式 |
| Shadcn UI | 组件库 |
| Better-auth | 认证 |
| Drizzle ORM | 数据库 ORM |
| Upstash | Redis 缓存 + 限流 |
| Stripe | 支付处理 |
| Vercel/Dokploy | 一键部署 |
| Vercel AI SDK | AI 能力集成 |
| Resend | 邮件服务 |
| Cloudflare R2 | 文件存储 |

**文档链接：**
- 官方文档: https://nexty.dev/docs
- GitHub: https://github.com/weijunext
- 作者 X: @Jude Wei

### 项目内部文档

- `@constitution.md` - 项目根本原则
- `@AGENTS.md` - 跨 Agent 通用规范
- `.claude/agents/` - 专家 Agent 定义
- `.claude/commands/` - 团队 SOP 指令
- `.claude/skills/` - 知识胶囊

---

## 十、品牌资源管理

### 资源规格

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `logo.png` | 192x192 | 网站 Logo |
| `logo.svg` | 矢量 | 可缩放 Logo |
| `logo-512.png` | 512x512 | PWA 图标 |
| `logo-maskable.png` | 192x192 | PWA Maskable (10% 安全区) |
| `logo-512-maskable.png` | 512x512 | PWA Maskable 大图 |
| `favicon.ico` | 16x16 + 32x32 | 浏览器标签图标 |
| `apple-touch-icon.png` | 180x180 | iOS 主屏图标 |
| `og.png` | 1200x630 | 社交分享图 (英文) |
| `og_zh.png` | 1200x630 | 社交分享图 (中文) |
| `og_ja.png` | 1200x630 | 社交分享图 (日文) |

### 生成脚本

```bash
# 生成全套品牌资源 (Logo/favicon/OG)
pnpm tsx scripts/generate-brand-assets.ts

# 生成 Features/UseCases 占位图
pnpm tsx scripts/generate-brand-images.ts

# 更新 i18n JSON 中的图片路径
pnpm tsx scripts/update-image-paths.ts

# 恢复 AI 生成的 favicon
pnpm tsx scripts/restore-favicon.ts
```

### 技术依赖

| 依赖 | 用途 | 安装 |
|------|------|------|
| `sharp` | 图像处理 (resize, composite, format) | `pnpm add -D sharp` |
| `png-to-ico` | PNG 转 ICO 格式 | `pnpm add -D png-to-ico` |

### 生成流程

```
1. kie.ai 生成 Logo 基础图 (1024x1024)
   ↓
2. Sharp 处理多尺寸
   ├── logo.png (192x192)
   ├── logo-512.png (512x512)
   ├── logo-maskable.png (带安全区)
   ├── favicon.ico (16x16 + 32x32)
   └── apple-touch-icon.png (180x180)

3. kie.ai 生成 OG 背景 (1200x630)
   ↓
4. Sharp 合成文字
   ├── og.png (英文)
   ├── og_zh.png (中文)
   └── og_ja.png (日文)
```

### 占位图位置

Features 和 UseCases 图片存放在 `public/images/brand/`：
- `feature-*.webp` - 功能展示图 (6张)
- `usecase-*.webp` - 使用场景图 (5张)

图片路径配置在 `i18n/messages/*/NanoBananaVideo.json`。

---

## 十一、上线检查清单

### P0 - 阻塞上线

| 项目 | 状态 | 说明 |
|------|------|------|
| 数据修复 | ✅ | "Stande Plan" → "Standard Plan" |
| 积分修复 | ✅ | Standard Plan 110,000 → 11,000 |
| 功能隐藏 | ✅ | 音乐/Remotion/Studio 从菜单移除 |
| 登录简化 | ✅ | 只保留 Google 登录 |
| 品牌资源 | ✅ | Logo/favicon/OG 图片已替换 |

### P1 - 重要

| 项目 | 状态 | 说明 |
|------|------|------|
| Features 图片 | ✅ | 6 张功能展示图 |
| UseCases 图片 | ✅ | 5 张使用场景图 |
| 社交链接 | ⬜ | 配置或移除空链接 |
| 客服邮箱 | ⬜ | 配置 EMAIL_URL |

### P2 - 技术验证

| 项目 | 说明 |
|------|------|
| 环境变量 | `NEXT_PUBLIC_SITE_URL`, `STRIPE_WEBHOOK_SECRET`, R2 配置等 |
| Webhook | Stripe webhook 端点配置 |
| 构建测试 | `pnpm lint` + `pnpm build` |
| 功能测试 | 登录、支付、视频/图片生成流程 |

### 修复脚本

```bash
# 执行数据库修复
pnpm tsx scripts/fix-launch-issues.ts
```

---

## 十二、R2 存储管理

### 文件夹结构

```
nanobananavideo/                    # R2 Bucket
├── website/                        # 网站专属资源 (公开)
│   ├── showcase/                   # 展示视频素材
│   │   ├── reference-to-video/     # 多参考图生视频模板
│   │   ├── start-end-frames/       # 首尾帧对比模板
│   │   └── audio-showcase/         # 带音频视频模板
│   └── gallery/                    # Gallery 页面素材 (后续)
│
└── users/                          # 用户生成资源
    ├── images/{userId}/            # 用户生成的图片
    └── videos/{userId}/            # 用户生成的视频
```

### 环境变量

```bash
R2_ACCOUNT_ID=<纯账户ID，不含URL>   # 例: 0d4042693bdf560b0fd435ae6935912c
R2_ACCESS_KEY_ID=<API Token ID>
R2_SECRET_ACCESS_KEY=<API Token Secret>
R2_BUCKET_NAME=nanobananavideo
R2_PUBLIC_URL=https://cdn.nanobananavideo.net
```

### 核心文件

```
lib/cloudflare/
├── r2-client.ts    # S3 客户端初始化
├── r2.ts           # 上传/删除/列表/预签名 URL
├── r2-utils.ts     # 工具函数 (key 生成等)
└── r2-download.ts  # 下载相关

app/api/kie/save-to-r2/route.ts  # 保存到 R2 的 API 端点
```

### 使用示例

```typescript
// 服务端直接上传
import { serverUploadFile } from '@/lib/cloudflare/r2';

const url = await serverUploadFile(buffer, 'website/showcase/test.mp4', 'video/mp4');

// 通过 API 保存 kie.ai 临时 URL 到 R2
const response = await fetch('/api/kie/save-to-r2', {
  method: 'POST',
  body: JSON.stringify({
    sourceUrl: 'https://tempfile.aiquickdraw.com/xxx.mp4',
    type: 'video',
    path: 'users/{userId}/videos',
  }),
});
```

### 测试脚本

```bash
# 测试 R2 上传
pnpm tsx scripts/test-r2-upload.ts
```

---

## 十三、展示素材生成

### 三种展示视频模板

| 模板 | 用途 | 素材 |
|------|------|------|
| Reference → Video | 多参考图生成视频 | 4张参考图 + 1个视频 |
| Start > End | 首尾帧对比 | 首帧图 + 视频 + 尾帧图 |
| Context-Aware Audio | 带音频视频展示 | 1个带音频视频 |

### 已生成素材 (R2)

```
website/showcase/
├── reference-to-video/case-1/     # 日式咖啡店主题
│   ├── ref-1.webp                 # 咖啡师肖像
│   ├── ref-2.webp                 # 手冲咖啡壶
│   ├── ref-3.webp                 # 拿铁艺术
│   ├── ref-4.webp                 # 咖啡店内景
│   └── output.mp4                 # 生成的视频
├── start-end-frames/case-1/       # 陶艺创作主题
│   ├── first-frame.webp           # 首帧
│   ├── last-frame.webp            # 尾帧 (待提取)
│   └── output.mp4                 # 生成的视频
└── audio-showcase/case-1/         # 海边冲浪主题
    └── output.mp4                 ```

### 生成脚本

```bash
# 批量生成展示素材 (图片+视频+上传R2)
pnpm tsx scripts/generate-showcase-assets.ts

# 单独重新生成某个视频
pnpm tsx scripts/regenerate-surfing-video.ts
```

### CDN 访问

所有素材通过 CDN 访问：
```
https://cdn.nanobananavideo.net/website/showcase/{模板}/{case}/{文件}
```

---

## 十四、外部资源参考

### UI/UX 设计资源

- **uiax-skill**: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
  - 57 种 UI 样式
  - 95 种行业配色方案
  - 56 种字体搭配
  - 可用于设计参考和 AI 辅助设计

