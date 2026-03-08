# Nano Banana Video

Nano Banana Video 是一个基于 Next.js 16、React 19、better-auth、Drizzle 和 PostgreSQL 构建的多语言 AI 生成产品。当前对外主产品聚焦于 Nano Banana 图像工作流、提示词生成，以及基于 Sora 2 和 Veo 3.1 Fast 的视频生成。

## 状态快照

最后核对时间：2026 年 3 月 8 日

- 默认首页路由 `/` 已经直接渲染 Nano Banana Video 的营销/产品页
- 当前实际在用的公开页面主要是 `/`、`/nanabananvideo`、`/video-generation`、`/prompt-generator`、`/login`，以及多语言下的定价和支付流程
- 当前代码里的视频模型主要包括 Sora 2、Sora 2 Pro 和 Veo 3.1 Fast；最近一轮工作重点是 Veo 3.1 Fast 生成链路和导航收敛
- 仓库里已具备图片生成、提示词生成、Google 登录、积分、定价、Stripe 支付、Stripe webhook、Blog/CMS、管理后台定价管理等能力
- 音乐生成、Studio、Remotion 编辑、Creem 支付能力仍然保留在代码中，但不是当前主对外产品面，部分导航入口已经被隐藏
- 当前 `i18n/messages` 下有 12 个语言目录
- 仓库里仍保留一部分历史模板信息和过期规划文档；如果要判断真实状态，优先看本 README、`STRIPE_CLI_SETUP.md` 和 `.kiro/specs/veo-3-1-integration/`

## 当前产品面

- Nano Banana to Video 的营销和 SEO 页面
- Prompt Generator UI 与 API
- 图片生成流程
- 视频生成 UI 与 API
- 任务轮询与生成历史
- 积分制计费与套餐
- Google 登录
- Stripe Checkout 与 Webhook
- 用户、订单、定价、博客、存储资源等后台页面

## 当前工程状态

- `pnpm lint` 目前未通过
- 2026 年 3 月 8 日本地复核结果为 18 个 error，27 个 warning
- 主要问题集中在 React Hook / purity 规则、effect 或 memo 中的同步状态更新、static component 规则，以及部分图片缺少 `alt`
- 仓库里仍有部分历史模板元信息和旧文档，需要继续逐步清理

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI
- next-intl
- Zustand
- Drizzle ORM
- PostgreSQL
- better-auth
- Stripe
- Cloudflare R2 / S3 兼容存储

## 关键路径

- `app/[locale]/(basic-layout)/page.tsx`：默认多语言首页
- `app/[locale]/(basic-layout)/nanabananvideo/page.tsx`：Nano Banana 独立落地页
- `app/[locale]/(basic-layout)/video-generation/page.tsx`：公开视频生成页
- `app/[locale]/(basic-layout)/prompt-generator/page.tsx`：公开提示词生成页
- `app/api/generation/video/route.ts`：统一视频生成 API
- `app/api/payment/checkout-session/route.ts`：支付会话创建
- `app/api/stripe/webhook/route.ts`：Stripe Webhook 处理
- `components/nanabananvideo/`：当前主营销页组件

## 本地开发

```bash
pnpm install
pnpm dev
```

然后访问 `http://localhost:3000`。

## 常用命令

```bash
pnpm dev
pnpm build
pnpm lint
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
pnpm db:seed
```

## 环境变量说明

这个项目依赖的环境变量比普通 Next.js 项目更多。本地开发通常至少需要：

- 数据库连接
- better-auth 密钥与 OAuth 凭证
- Stripe 密钥与 webhook secret
- KIE API Key
- R2 / S3 存储凭证
- Resend 邮件凭证

完整模板见 `.env.example`。

## 重要文档

- `STRIPE_CLI_SETUP.md`：本地 Stripe webhook 工具说明
- `.kiro/specs/veo-3-1-integration/README.md`：Veo 3.1 Fast 实施概览
- `.kiro/specs/veo-3-1-integration/COMPLETION_SUMMARY.md`：Veo 3.1 完成说明
- `LAUNCH-TODO.md`：历史上线清单，部分内容已过期
- `GALLERY_TODO.md`：历史 Gallery 规划文档，已不能反映真实进度

## 仓库备注

- 这个项目是从 SaaS boilerplate 改造而来，所以仍保留部分旧命名和旧文档
- 不是仓库里的每一份文档都能代表当前真实产品状态
- 如果需要快速建立正确上下文，优先看当前活跃路由、最近提交和上面列出的文档
