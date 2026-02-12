# Stripe CLI 配置指南

## 当前状态

| 项目 | 状态 |
|------|------|
| **安装路径** | `~/bin/stripe.exe` |
| **版本** | `stripe version 1.19.2` |
| **登录状态** | ✅ 已登录 |
| **密钥有效期** | `2026-05-07` |

## 1. 安装 Stripe CLI

### ✅ 已完成

CLI 已安装到 `~/bin/stripe.exe`

### 如需重新安装

```powershell
# 使用 Scoop
scoop bucket add stripe
scoop install stripe-cli

# 或使用 Winget
winget install Stripe.StripeCLI

# 或手动下载
# https://github.com/stripe/stripe-cli/releases
# 下载 stripe_x.x.x_windows_x86_64.zip，解压后添加到 PATH
```

### 验证安装

```bash
~/bin/stripe.exe --version
# 输出: stripe version 1.19.2
```

## 2. 登录状态

### ✅ 已登录

```bash
# 查看当前配置
~/bin/stripe.exe config --list
```

## 3. 启动 Webhook 转发

### 方式一：使用 npm script (推荐)

```bash
# 监听所有配置的事件
pnpm stripe:listen

# 或者只监听核心事件
pnpm stripe:listen:all
```

### 方式二：手动运行

```bash
~/bin/stripe.exe listen --forward-to localhost:3000/api/stripe/webhook
```

### 启动后输出示例

```
> Ready! You are using Stripe API Version [...]
> Webhook signing secret is whsec_xxxx (!!!)
> Ready! You are using Stripe API Version [...]
> Your webhook signing secret is whsec_... (!!)
> Waiting for webhooks...
```

### 仅获取 Webhook Secret（不启动监听）

```bash
~/bin/stripe.exe listen --forward-to localhost:3000/api/stripe/webhook --print-secret
```

## 4. 环境变量配置

### ✅ 已配置

从 `stripe listen --print-secret` 获取的 Secret 已添加到 `.env.local`：

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

## 5. 项目 NPM Scripts

```json
{
  "stripe:login": "~/bin/stripe.exe login",
  "stripe:listen": "~/bin/stripe.exe listen --forward-to localhost:3000/api/stripe/webhook",
  "stripe:listen:all": "~/bin/stripe.exe listen --forward-to localhost:3000/api/stripe/webhook --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed,charge.refunded,radar.early_fraud_warning.created",
  "stripe:trigger:checkout": "~/bin/stripe.exe trigger checkout.session.completed",
  "stripe:trigger:subscription": "~/bin/stripe.exe trigger customer.subscription.created",
  "stripe:trigger:invoice_paid": "~/bin/stripe.exe trigger invoice.paid"
}
```

## 6. 测试 Webhook

### 触发测试事件

```bash
# 测试支付完成
pnpm stripe:trigger:checkout

# 测试订阅创建
pnpm stripe:trigger:subscription

# 测试发票支付
pnpm stripe:trigger:invoice_paid
```

### 手动触发特定事件

```bash
~/bin/stripe.exe trigger checkout.session.completed
~/bin/stripe.exe trigger customer.subscription.created
~/bin/stripe.exe trigger invoice.paid
~/bin/stripe.exe trigger charge.refunded
```

### 支持的触发事件

- `account.application.deauthorized`
- `balance.available`
- `charge.captured`, `charge.failed`, `charge.refunded`, `charge.succeeded`
- `checkout.session.async_payment_failed`, `checkout.session.async_payment_succeeded`, `checkout.session.completed`
- `customer.created`, `customer.updated`, `customer.deleted`
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- `invoice.created`, `invoice.finalized`, `invoice.paid`, `invoice.payment_failed`
- `payment_intent.*`
- `product.created`, `product.updated`, `product.deleted`
- 等更多...

## 7. 常用命令

| 命令 | 说明 |
|------|------|
| `~/bin/stripe.exe login` | 登录 Stripe 账户 |
| `~/bin/stripe.exe logout` | 登出 |
| `~/bin/stripe.exe config --list` | 查看当前配置 |
| `~/bin/stripe.exe listen` | 启动 webhook 转发 |
| `~/bin/stripe.exe trigger <event>` | 触发测试事件 |
| `~/bin/stripe.exe events` | 查看最近的 events |
| `~/bin/stripe.exe customers list` | 列出客户 |
| `~/bin/stripe.exe open` | 在浏览器打开 Stripe Dashboard |

## 8. 配置的 Webhook 事件

项目已配置监听以下事件（位于 `app/api/stripe/webhook/route.ts`）：

- `checkout.session.completed` - 支付完成
- `customer.subscription.created` - 订阅创建
- `customer.subscription.updated` - 订阅更新
- `customer.subscription.deleted` - 订阅取消
- `invoice.paid` - 发票支付成功
- `invoice.payment_failed` - 发票支付失败
- `charge.refunded` - 退款
- `radar.early_fraud_warning.created` - 欺诈警告

## 9. 完整工作流

```bash
# 终端 1: 启动开发服务器
pnpm dev

# 终端 2: 启动 Stripe webhook 监听
pnpm stripe:listen

# 终端 3: 测试触发事件
pnpm stripe:trigger:checkout
```

## 10. 配置文件

### stripe.config.json

项目根目录包含 `stripe.config.json`，定义了 webhook 端点配置：

```json
{
  "webhookEndpoints": [
    {
      "name": "nano-video-local",
      "url": "http://localhost:3000/api/stripe/webhook",
      "events": [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.paid",
        "invoice.payment_failed",
        "charge.refunded",
        "radar.early_fraud_warning.created"
      ]
    }
  ]
}
```

## 11. 故障排查

### 权限错误 (Windows)

如果遇到 "Permission denied" 错误：

1. 卸载 npm 版本：`npm uninstall -g stripe-cli`
2. 使用官方安装方式重新安装

### Webhook 不触发

1. 确认 `stripe listen` 正在运行
2. 确认 `.env.local` 中的 `STRIPE_WEBHOOK_SECRET` 是最新的
3. 检查端口 3000 是否被占用

### 重新获取 Webhook Secret

```bash
~/bin/stripe.exe listen --forward-to localhost:3000/api/stripe/webhook --print-secret
```

### 查看 Stripe CLI 日志

`stripe listen` 会实时显示接收到的 webhooks，可用于调试。
