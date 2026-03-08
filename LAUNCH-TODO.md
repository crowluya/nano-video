# Nano Banana Video - 上线状态同步

> 同步时间：2026-03-08
> 说明：本文件基于当前仓库代码状态更新，不等同于生产环境实测结果。凡是数据库内容、第三方控制台配置、线上环境变量、支付/登录实测，若未在代码中可验证，统一标记为“待人工确认”。

---

## 一、当前真实状态概览

### 代码已确认

- 默认首页 `/` 已切到 Nano Banana Video 产品页
- 公开主页面存在：`/`、`/nanabananvideo`、`/video-generation`、`/prompt-generator`、`/login`
- 视频生成主能力存在，当前代码重点支持：
  - Sora 2
  - Sora 2 Pro
  - Veo 3.1 Fast
- 图片生成、Prompt Generator、Blog/CMS、后台管理、积分体系、Stripe 支付链路均存在
- 登录 UI 当前只保留 Google 登录按钮
- Gallery 已实际落地，不是未开始状态

### 代码中仍保留但不是当前主产品面的能力

- `music-gen` 页面仍在代码中
- `studio` 页面仍在代码中
- Remotion 相关组件仍在代码中
- Creem 支付链路仍在代码中

### 当前工程风险

- `pnpm lint` 未通过
- 2026-03-08 本地复核结果：18 errors，27 warnings
- `app/[locale]/(basic-layout)/nanabananvideo/page.tsx` 仍引用 `/og-image.jpg`，但 `public/` 下当前是 `og.png / og_zh.png / og_ja.png`
- 图片积分配置存在代码不一致：
  - `config/models.ts` 中 `google/nano-banana` 为 `5`
  - `components/image-generation/ImageGenerationPage.tsx` 中 UI 按 `15` 计费展示

---

## 二、上线相关事项同步

### A. 已完成或基本完成

- [x] 首页和核心产品面已切换到 Nano Banana Video
- [x] Google 登录 UI 已落地
- [x] Stripe checkout session API 已存在
- [x] Stripe webhook 路由已存在
- [x] 隐私政策页面存在：`/privacy-policy`
- [x] 服务条款页面存在：`/terms-of-service`
- [x] 退款政策页面存在：`/refund-policy`
- [x] Logo、favicon、apple touch icon 资源已存在于 `public/`
- [x] Gallery 已接入首页并使用 CDN 视频资源

### B. 部分完成，需要继续收口

- [~] **AUTH-001 只保留 Google 登录**
  - 代码层面：登录表单已只剩 Google
  - 仍需清理：翻译文案中还保留 GitHub / Magic Link 相关文案痕迹

- [~] **HIDE-001 / HIDE-002 / HIDE-003 隐藏非主功能入口**
  - 当前用户菜单中没有 `music-gen` / `studio` / remotion 入口
  - 但对应页面与代码仍保留在仓库中
  - 如果目标是“对外不暴露”，当前大体成立
  - 如果目标是“彻底移除”，尚未完成

- [~] **品牌资源**
  - `logo.png`、`logo.svg`、`favicon.ico` 已存在
  - 但 OG 图实现仍不一致：页面代码引用 `/og-image.jpg`，仓库内实际资源为 `og.png / og_zh.png / og_ja.png`

- [~] **法律文档**
  - 页面路由已存在
  - 是否满足真实上线法务要求，仍需人工审阅内容

### C. 仍待人工确认

- [ ] **FIX-001**：数据库里是否仍有 `Stande Plan`
- [ ] **FIX-002**：数据库里 `Standard Plan` 是否仍错误写成 `110,000`
- [ ] **HIDE-004**：生产定价页是否仍显示 Creem 套餐
- [ ] `NEXT_PUBLIC_SITE_URL` 在线上是否已正确设置为正式域名
- [ ] Google OAuth 线上回调是否已正确配置
- [ ] Stripe webhook 在线上控制台是否已配置并指向正式域名
- [ ] R2 / 邮件 / KIE 线上环境变量是否齐全
- [ ] 生产环境支付、图片生成、视频生成链路是否已实测通过

---

## 三、基于当前代码的任务清单

### P0：必须先修

- [ ] 修复图片积分配置不一致
  - `config/models.ts` 中 `google/nano-banana` 为 5 credits
  - `components/image-generation/ImageGenerationPage.tsx` 中 UI 写死为 15 credits

- [ ] 修复站点基础元信息残留
  - `package.json` 和若干开发文案仍有模板残留

- [ ] 修复 OG 图片引用不一致
  - 当前代码引用 `/og-image.jpg`
  - 当前静态资源实际存在 `public/og.png`、`public/og_zh.png`、`public/og_ja.png`

- [ ] 清理当前 lint errors
  - 当前 `pnpm lint` 失败，不适合当作“已完成上线前检查”

### P1：建议上线前完成

- [ ] 清理 GitHub / Magic Link 的残留翻译文案
- [ ] 明确是否彻底停用 Creem
  - 如果停用，应同步清理价格页展示、checkout 入口和后台配置路径
- [ ] 明确是否继续保留 `music-gen` / `studio` / remotion 页面
  - 若仅内部保留，应在文档中明确
  - 若不再需要，应考虑移除路由和相关代码

### P2：内容与品牌完善

- [ ] 完整审查隐私政策、服务条款、退款政策文本
- [ ] 配置 Twitter / GitHub / Support Email 等站点信息
- [ ] 替换通用 Landing 文案中仍在使用的 `/placeholder.webp`

---

## 四、验证结果记录

### 已验证

- [x] 首页产品组件来自 `components/nanabananvideo/`
- [x] Gallery 已实际渲染到首页
- [x] Hero 按钮已支持跳转 `/#gallery`
- [x] LoginForm 当前仅包含 Google 登录按钮
- [x] Stripe checkout session API 存在
- [x] Stripe webhook handler 存在

### 未验证

- [ ] `pnpm build`
- [ ] 三语言切换完整回归
- [ ] 真实登录流程
- [ ] 真实支付流程
- [ ] 真实视频生成流程
- [ ] 真实图片生成流程

---

## 五、结论

这不是一份“从零开始的上线待办”了。当前仓库的真实状态是：

- 主产品页、Gallery、Prompt Generator、图片/视频生成、Google 登录、Stripe 链路都已经存在
- 旧文档里大量“未开始”或“阻塞上线”的描述已经失真
- 真正需要优先处理的，是配置一致性、站点元信息残留、OG 资源引用、Creem 是否继续保留，以及 `pnpm lint` 失败这一类工程收口问题
