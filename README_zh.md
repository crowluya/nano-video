# Nexty - 现代化全栈 SaaS 模板

Nexty 是一个功能丰富的全栈 SaaS 应用模板，基于 Next.js 15、React 19 和 Supabase 构建，为开发者提供了快速构建和部署 SaaS 应用的完整解决方案。

🚀 获取模板 👉：https://nexty.dev  
🚀 Roadmap 👉: https://nexty.dev/zh/roadmap

> Nexty.dev 的文档正在准备，请先阅读这份 Readme 开始使用，入遇到任何问题，请联系我支持：
> 邮箱：hi@nexty.dev
> 推特（中文）：https://x.com/weijunext
> 微信：bigye_chengpu

## ✨ 主要特性

- 🚀 **Next.js 15 & React 19** - 基于最新技术栈构建
- 💳 **Stripe 集成** - 完整的订阅支付系统
- 🔒 **Supabase 身份认证** - 安全可靠的用户管理
- 🌍 **国际化支持** - 内置英文、中文和日文支持
- 🧠 **AI 集成** - 支持多种 AI 提供商 (OpenAI, Anthropic, DeepSeek, Google 等)
- 📊 **管理仪表盘** - 用户管理、定价计划、内容管理等
- 📱 **响应式设计** - 完美适配各种设备
- 🎨 **Tailwind CSS** - 现代化 UI 设计
- 📧 **邮件系统** - 基于 Resend 的通知和营销邮件
- 🖼️ **R2/S3 存储** - 媒体文件云存储支持

## 🚀 快速开始

### 前置条件

- Node.js 18+ 和 pnpm
- 在 CloudFlare 配置域名邮箱
- 使用域名邮箱分别注册 Supabase、Upstash、Resend 账号
- Stripe 账户用于支付集成(可选) 
  - 将环境变量 NEXT_PUBLIC_ENABLE_STRIPE 设为 false，即关闭支付功能

### 安装步骤

1. **克隆项目**

```bash
git clone git@github.com:WeNextDev/nexty.dev.git
cd nexty
```

2. **安装依赖**

```bash
pnpm install
```

3. **环境配置**

复制 `.env.example` 文件并重命名为 `.env.local`，然后配置必要的环境变量：

```bash
cp .env.example .env.local
```

4. **配置 Supabase**

在 Supabase 中创建新项目，并将生成的 URL 和匿名密钥添加到 `.env.local` 文件中。

5. **配置 Supabase auth**

根据 `/README/supabase/auth` 的截图教程进行配置（相关文档很快会发布）

6. **执行数据库命令**

登录 Supabase，在 SQL Editor 里面依次执行 `/data` 文件夹下的所有 sql 文件

7. **本地生成 Supabase types.ts**
 
先根据你的平台安装 supabase-cli: https://supabase.com/docs/guides/local-development/cli/getting-started 

然后在本地命令行依次执行下面命令：

```
supabase login

supabase gen types typescript --project-id <your-project-id> --schema public > lib/supabase/types.ts
```

后续更新 Supabase table、pilicy、trigger、function 都要再次执行

> 如果遇到命令行提示需要升级 supabase-cli 版本，在上面的链接里找到升级命令，先执行升级命令，再执行 supabase gen 命令。

8. **配置 Stripe (可选)**

若需支付功能，请先根据 `/README/stripe` 的截图教程进行配置（相关文档很快就会发布），然后将 Stripe API 密钥添加到 `.env.local` 文件中。

9. **运行开发服务器**

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看您的应用。

## 📂 项目结构

```
app/                  # Next.js 应用目录
├── [locale]/         # 国际化路由
├── api/              # API 端点
├── auth/             # 认证相关组件
components/           # 共享 UI 组件
config/               # 网站配置
lib/                  # 工具函数和服务
emails/               # 邮件模板
i18n/                 # 国际化配置和翻译文件
public/               # 静态资源
```

## 💡 主要功能模块

- **用户认证** - Google授权、GitHub授权、Magic Link
- **订阅管理** - 套餐选择、支付处理、账单管理
- **内容管理** - 博客、展示案例、静态页面(CMS 正在开发中)
- **用户仪表盘** - 账户设置、订阅管理、使用统计
- **管理后台** - 用户管理、定价计划、内容管理
- **AI 功能 Demo** - 通过多种 AI 功能演示让你更快学会开发 AI 功能

## 🌍 国际化

项目已内置支持英文、中文和日文：

1. `i18n/messages/`
2. `i18n/routing.ts`

## 🔧 常见问题解决

### API 密钥无效

确保您在 `.env.local` 文件中正确配置了 Supabase 和其他服务的 API 密钥。

### 支付测试

在 Stripe 测试模式下，可以使用测试卡号 `4242 4242 4242 4242` 进行支付测试。
