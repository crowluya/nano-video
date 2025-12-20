# Stripe Webhook 本地测试指南

## 当前状态

### 网页 Webhook（生产/测试环境）
- **端点 URL**: `https://sweet-plants-camp.loca.lt/api/stripe/webhook`
- **状态**: 活跃，但有 8 个失败事件
- **Secret**: 网页上的 `whsec_...`（与本地不同）

### 本地 Webhook（开发环境）
- **端点 URL**: `localhost:3000/api/stripe/webhook`
- **Stripe CLI Secret**: `whsec_ccecf4cd9bc3d0963dde757b55c38a2ab6b0399b551fdc546fb16e4cb333fa51`
- **状态**: 已启动并运行

## 本地测试步骤

### 1. 确保环境变量正确

在 `.env.local` 中设置：
```bash
STRIPE_WEBHOOK_SECRET=whsec_ccecf4cd9bc3d0963dde757b55c38a2ab6b0399b551fdc546fb16e4cb333fa51
```

**重要**: 这个 secret 是 Stripe CLI 提供的，与网页 webhook 的 secret **不同**。

### 2. 启动服务

```bash
# 终端 1: 启动 Next.js 开发服务器
pnpm dev

# 终端 2: 启动 Stripe CLI webhook 监听器
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 3. 网页 Webhook 处理方式

**选项 A: 暂时禁用（推荐）**
- 在 Stripe Dashboard 中，找到 webhook "exquisite-inspiration"
- 点击 "编辑接收端" (Edit Receiver)
- 暂时禁用该 webhook
- **优点**: 避免混淆，本地测试不会收到网页 webhook 的事件
- **缺点**: 需要记住重新启用

**选项 B: 保持启用（不推荐）**
- 如果保持启用，Stripe 会同时向两个端点发送事件
- 可能导致重复处理或混淆
- 如果网页 webhook 的事件到达本地服务器，会因为 secret 不匹配而失败

### 4. 测试支付流程

1. 访问 `http://localhost:3000/dashboard/subscription`
2. 选择定价计划并点击 "Subscribe" 或 "Purchase"
3. 使用 Stripe 测试卡号完成支付：
   - 卡号: `4242 4242 4242 4242`
   - 到期日期: `12/34`
   - CVC: `123`
   - 邮编: `12345`

### 5. 观察日志

**Stripe CLI 终端** 应该显示：
```
2025-12-20 15:XX:XX   --> checkout.session.completed [evt_xxx]
2025-12-20 15:XX:XX  <-- [200] POST http://localhost:3000/api/stripe/webhook [evt_xxx]
```

**Next.js 开发服务器终端** 应该显示：
```
[Stripe Webhook] POST request received
[Stripe Webhook] Event constructed: { type: 'checkout.session.completed', id: 'evt_xxx' }
[handleCheckoutSessionCompleted] Entry: { sessionId: 'cs_xxx', mode: 'payment', metadata: {...} }
```

## 失败原因分析

网页 webhook 的 8 个失败事件可能由以下原因导致：

1. **Secret 不匹配**: 网页 webhook 的 secret 与 `.env.local` 中的不匹配
2. **端点不可达**: `https://sweet-plants-camp.loca.lt` 可能已过期或不可访问
3. **处理错误**: 事件到达但处理过程中出错（如数据库连接失败、metadata 缺失等）

## 建议

1. **本地测试时**: 禁用网页 webhook，使用 Stripe CLI
2. **生产环境**: 启用网页 webhook，使用生产环境的 secret
3. **调试**: 查看 Stripe Dashboard 中的 webhook 日志，了解具体失败原因

