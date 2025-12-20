# Stripe Webhook 测试指南

## 已完成的工作

### 1. 定价计划更新 ✅
所有定价计划的积分配置已成功更新：
- **月付计划**: $29.99 (3,000), $99.99 (110,000), $199.99 (24,000)
- **年付计划**: $299.9 (3,000/月), $999.9 (110,000/月), $1999.9 (24,000/月)
- **一次性**: $49.99 (5,000)

### 2. Stripe Webhook CLI 启动 ✅
Webhook CLI 已在后台启动，转发到 `localhost:3000/api/stripe/webhook`

## 测试 Webhook

### 方法 1: 使用 Stripe CLI 触发测试事件

在新的终端窗口中运行：

```bash
# 触发 checkout.session.completed 事件
stripe trigger checkout.session.completed

# 触发 invoice.paid 事件（订阅支付）
stripe trigger invoice.paid

# 触发 customer.subscription.created 事件
stripe trigger customer.subscription.created
```

### 方法 2: 检查 Webhook 日志

查看 Stripe CLI 的输出，应该能看到：
- Webhook secret (以 `whsec_` 开头)
- 接收到的 webhook 事件
- 转发状态

### 方法 3: 在 Stripe Dashboard 中测试

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. 找到你的 webhook 端点
3. 点击 "Send test webhook"
4. 选择事件类型（如 `checkout.session.completed`）
5. 发送测试事件

## 验证 Webhook 是否工作

1. **检查服务器日志**: 查看 Next.js 开发服务器的控制台输出
2. **检查数据库**: 验证订单和积分是否正确创建
3. **检查 Stripe CLI 输出**: 应该显示 "200 OK" 响应

## 注意事项

- 确保 `.env.local` 中的 `STRIPE_WEBHOOK_SECRET` 与 Stripe CLI 显示的 secret 匹配
- 如果 webhook secret 不匹配，需要更新环境变量并重启开发服务器
- 测试时使用 Stripe 测试模式（test mode）

