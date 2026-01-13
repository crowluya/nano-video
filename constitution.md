# Nano Banana Video - 项目宪法

## 第一条：简单性原则

### YAGNI (You Aren't Gonna Need It)
- 只实现 spec.md 中明确要求的功能
- 拒绝"以防万一"的过度设计
- 未来需求等到真正需要时再实现

### 标准库优先
- 优先使用 Next.js 内置功能（路由、图片优化、字体优化）
- 优先使用 React 原生能力（Server Components、Suspense）
- 避免不必要的抽象层和封装

### 反过度工程
- 组件层级不超过 3 层
- 不要为了"可复用"而过度抽象
- 明确的代码比"聪明"的代码更好

---

## 第二条：现代 React/Next.js 开发

### React 19 & Next.js 16 规范
- 优先使用 **Server Components**，只在必要时使用 Client Components
- 正确使用 `'use client'` 指令，不随意滥用
- 利用 App Router 的嵌套布局和并行路由
- 使用 Server Actions 处理表单和 mutations

### 性能原则
- 图片必须使用 `next/image` 组件
- 动态导入非首屏必要的大型组件 (`next/dynamic`)
- 合理使用 `revalidate` 和缓存策略
- 避免客户端不必要的 re-render

### TypeScript 规范
- 所有文件必须使用 TypeScript
- 禁止使用 `any`，使用 `unknown` 代替
- 明确的类型定义优于类型推断
- 组件 Props 必须定义 interface

---

## 第三条：国际化 (i18n) 规范

### 多语言优先
- 所有用户可见文本必须通过 `useTranslations()` 或 `getTranslations()`
- 禁止在代码中硬编码中文、英文或日文文本
- 翻译 key 使用命名空间（如 `Landing.hero.title`）

### 翻译文件管理
- 翻译文件位于 `i18n/messages/{locale}/`
- 新增功能时同步更新 en/zh/ja 三个语言
- 保持 key 命名一致性和层级清晰

---

## 第四条：UI/UX 规范

### 设计系统
- 使用 Radix UI 作为无障碍基础
- 使用 Tailwind CSS 进行样式开发
- 遵循既定的颜色系统 (`config/colors.ts`)
- 保持移动端响应式设计

### 可访问性 (a11y)
- 所有交互元素必须有正确的 ARIA 标签
- 支持键盘导航
- 确保足够的颜色对比度
- 使用语义化 HTML

---

## 第五条：数据与状态管理

### 数据库规范
- 使用 Drizzle ORM 定义 schema
- 所有数据库操作必须在 Server 端进行
- 使用 prepared statements 防止 SQL 注入

### 状态管理
- 服务端状态：使用 SWR 或 React Server Components
- 客户端状态：优先使用 React 内置状态（useState、useReducer）
- 全局状态：使用 Zustand（仅用于必要的客户端全局状态）

---

## 第六条：测试与质量

### 测试策略
- 核心业务逻辑必须有单元测试
- API 路由必须有集成测试
- 关键用户流程需要 E2E 测试

### 代码质量
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 提交前确保 `npm run lint` 通过

---

## 第七条：安全原则

### 敏感数据保护
- API 密钥、数据库连接串等必须使用环境变量
- 禁止将 `.env.local` 提交到仓库
- 客户端代码禁止暴露敏感信息

### 用户输入验证
- 所有用户输入必须验证和清理
- 使用 Zod schema 进行运行时验证
- 防止 XSS 和注入攻击

---

## 第八条：Git 工作流

### 分支策略
- `main` - 生产环境，受保护
- `develop` - 开发环境
- `feature/*` - 功能分支
- `fix/*` - 修复分支

### 提交规范
使用 Conventional Commits：
- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式（不影响功能）
- `refactor:` - 重构
- `test:` - 测试相关
- `chore:` - 构建/工具相关

---

## 第九条：浏览器操作

### Playwright MCP 优先
- 所有浏览器自动化必须使用 Playwright MCP
- 禁止使用 WebFetch 进行网页访问
- 遵循标准的浏览器交互流程：navigate → wait → snapshot → action → close

---

## 第十条：AI 协作原则

### 规范驱动开发 (SDD)
- spec.md 是需求的唯一真理来源
- 实现偏差时修复代码，不改 spec
- 需求偏差时更新 spec.md，然后修改实现

### TDD 流程
- 先写测试，再写实现
- RED → GREEN → REFACTOR 循环
- 测试是理解需求的工具，不仅是验证

---

*本项目宪法是团队协作的基础，所有开发活动应遵循这些原则。*
