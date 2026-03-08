# Stripe 订阅配置信息

## 📦 产品与价格 ID 映射表

### 1. Basic Plan（基础套餐）
- **Product ID**: `prod_TblL3Y3y25Xujm`
- **月付 Price ID**: `price_1SeXoePdOkGgbzOgb3MhUpGW` ($29.99/月)
- **年付 Price ID**: `price_1SeXyqPdOkGgbzOgEAoUg036` ($299.90/年)

### 2. Stande Plan（专业套餐）
- **Product ID**: `prod_TblLPppzuH8sMo`
- **月付 Price ID**: `price_1SeXp8PdOkGgbzOg6G1Nzmca` ($99.99/月)
- **年付 Price ID**: `price_1SeXzJPdOkGgbzOgQUiUmH9d` ($999.90/年)

### 3. Ultra Plan（企业套餐）
- **Product ID**: `prod_TblMk1ieD4lpU4`
- **月付 Price ID**: `price_1SeXpWPdOkGgbzOgIvQfqxHd` ($199.99/月)
- **年付 Price ID**: `price_1SeXznPdOkGgbzOggAMXRJtB` ($1,999.90/年)

### 4. One-Time Payment（一次性支付）
- **Product ID**: `prod_TblMr3sWHtSSwC`
- **Price ID**: `price_1SeXq8PdOkGgbzOgMjqJyPzD` (一次性)

---

## 🗄️ 数据库配置（pricing_plans 表）

需要在数据库中创建 **7 条记录**（6个订阅 + 1个一次性）：

### Basic Plan - 月付
```json
{
  "card_title": "Basic Plan",
  "environment": "development",  // 或 "production"
  "provider": "stripe",
  "stripe_product_id": "prod_TblL3Y3y25Xujm",
  "stripe_price_id": "price_1SeXoePdOkGgbzOgb3MhUpGW",
  "payment_type": "recurring",
  "recurring_interval": "month",
  "price": "29.99",
  "currency": "usd",
  "display_price": "$29.99",
  "recurring_interval": "month",
  "benefits_jsonb": {
    "monthlyCredits": 100  // 根据实际权益填写
  }
}
```

### Basic Plan - 年付
```json
{
  "card_title": "Basic Plan",
  "environment": "development",
  "provider": "stripe",
  "stripe_product_id": "prod_TblL3Y3y25Xujm",
  "stripe_price_id": "price_1SeXyqPdOkGgbzOgEAoUg036",
  "payment_type": "recurring",
  "recurring_interval": "year",
  "price": "299.90",
  "currency": "usd",
  "display_price": "$299.90",
  "recurring_interval": "year",
  "benefits_jsonb": {
    "monthlyCredits": 100,
    "totalMonths": 12
  }
}
```

### Stande Plan - 月付
```json
{
  "card_title": "Stande Plan",
  "environment": "development",
  "provider": "stripe",
  "stripe_product_id": "prod_TblLPppzuH8sMo",
  "stripe_price_id": "price_1SeXp8PdOkGgbzOg6G1Nzmca",
  "payment_type": "recurring",
  "recurring_interval": "month",
  "price": "99.99",
  "currency": "usd",
  "display_price": "$99.99",
  "recurring_interval": "month",
  "benefits_jsonb": {
    "monthlyCredits": 300  // 根据实际权益填写
  }
}
```

### Stande Plan - 年付
```json
{
  "card_title": "Stande Plan",
  "environment": "development",
  "provider": "stripe",
  "stripe_product_id": "prod_TblLPppzuH8sMo",
  "stripe_price_id": "price_1SeXzJPdOkGgbzOgQUiUmH9d",
  "payment_type": "recurring",
  "recurring_interval": "year",
  "price": "999.90",
  "currency": "usd",
  "display_price": "$999.90",
  "recurring_interval": "year",
  "benefits_jsonb": {
    "monthlyCredits": 300,
    "totalMonths": 12
  }
}
```

### Ultra Plan - 月付
```json
{
  "card_title": "Ultra Plan",
  "environment": "development",
  "provider": "stripe",
  "stripe_product_id": "prod_TblMk1ieD4lpU4",
  "stripe_price_id": "price_1SeXpWPdOkGgbzOgIvQfqxHd",
  "payment_type": "recurring",
  "recurring_interval": "month",
  "price": "199.99",
  "currency": "usd",
  "display_price": "$199.99",
  "recurring_interval": "month",
  "benefits_jsonb": {
    "monthlyCredits": 500  // 根据实际权益填写
  }
}
```

### Ultra Plan - 年付
```json
{
  "card_title": "Ultra Plan",
  "environment": "development",
  "provider": "stripe",
  "stripe_product_id": "prod_TblMk1ieD4lpU4",
  "stripe_price_id": "price_1SeXznPdOkGgbzOggAMXRJtB",
  "payment_type": "recurring",
  "recurring_interval": "year",
  "price": "1999.90",
  "currency": "usd",
  "display_price": "$1,999.90",
  "recurring_interval": "year",
  "benefits_jsonb": {
    "monthlyCredits": 500,
    "totalMonths": 12
  }
}
```

### One-Time Payment
```json
{
  "card_title": "One-Time Payment",
  "environment": "development",
  "provider": "stripe",
  "stripe_product_id": "prod_TblMr3sWHtSSwC",
  "stripe_price_id": "price_1SeXq8PdOkGgbzOgMjqJyPzD",
  "payment_type": "one_time",
  "recurring_interval": null,
  "price": "根据实际价格填写",
  "currency": "usd",
  "display_price": "根据实际价格填写",
  "benefits_jsonb": {
    "oneTimeCredits": 50  // 根据实际权益填写
  }
}
```

---

## 🔧 环境变量配置

### 必需的环境变量

在 `.env.local` 或 `.env` 文件中配置：

```bash
# Stripe 配置
STRIPE_SECRET_KEY=sk_test_...  # 或 sk_live_... (生产环境)
STRIPE_WEBHOOK_SECRET=whsec_u0fqPSANnpQNe8EPiVDh9jWvMT0plNEN
STRIPE_CUSTOMER_PORTAL_URL=dashboard/subscription  # Customer Portal 路径
```

### 环境变量说明

1. **STRIPE_SECRET_KEY**
   - 测试环境：`sk_test_...`
   - 生产环境：`sk_live_...`
   - 获取位置：Stripe Dashboard → Developers → API keys → Secret key

2. **STRIPE_WEBHOOK_SECRET**
   - 当前值：`whsec_u0fqPSANnpQNe8EPiVDh9jWvMT0plNEN`
   - 获取位置：Stripe Dashboard → Developers → Webhooks → 点击你的 Webhook → Signing secret

3. **STRIPE_CUSTOMER_PORTAL_URL**
   - 客户门户的路径（相对路径）
   - 例如：`dashboard/subscription` 或 `account/billing`

---

## 📋 订阅变更关系矩阵

### 支持的订阅变更场景

| 从 | 到 | 变更类型 | 处理函数 |
|---|---|---------|---------|
| Basic 月付 | Basic 年付 | `monthly_to_yearly_change` | `handleMonthlyToYearlyChange` |
| Basic 年付 | Basic 月付 | `yearly_to_monthly_change` | `handleYearlyToMonthlyChange` |
| Basic 月付 | Stande 月付 | `monthly_to_monthly_upgrade` | `handleMonthlyToMonthlyUpgrade` |
| Stande 月付 | Basic 月付 | `monthly_to_monthly_downgrade` | `handleMonthlyToMonthlyDowngrade` |
| Basic 年付 | Stande 年付 | `yearly_to_yearly_upgrade` | `handleYearlyToYearlyUpgrade` |
| Stande 年付 | Basic 年付 | `yearly_to_yearly_downgrade` | `handleYearlyToYearlyDowngrade` |
| Basic 月付 | Ultra 月付 | `monthly_to_monthly_upgrade` | `handleMonthlyToMonthlyUpgrade` |
| Ultra 月付 | Basic 月付 | `monthly_to_monthly_downgrade` | `handleMonthlyToMonthlyDowngrade` |
| Basic 月付 | Stande 年付 | `monthly_to_yearly_change` + 升级 | `handleMonthlyToYearlyChange` |
| Stande 年付 | Basic 月付 | `yearly_to_monthly_change` + 降级 | `handleYearlyToMonthlyChange` |

**总计：18+ 种订阅变更场景**

---

## ✅ 配置检查清单

### Stripe Dashboard
- [x] 已创建 3 个产品（Basic、Stande、Ultra）
- [x] 每个产品已添加月付和年付价格
- [x] 已记录所有 Product ID 和 Price ID
- [ ] 已配置 Customer Portal，启用订阅变更
- [ ] 已配置 Webhook 端点
- [ ] 已获取 Webhook Secret

### 项目配置
- [ ] 在数据库 `pricing_plans` 表中创建 7 条记录
- [ ] 填写所有 Stripe ID 和价格信息
- [ ] 配置 `benefits_jsonb` 字段（积分等权益）
- [ ] 检查环境变量配置

### 代码实现
- [ ] 实现订阅变更处理函数（6个函数）
- [ ] 在 `handleSubscriptionUpdate` 中集成变更检测
- [ ] 测试所有订阅变更场景

---

## 📝 注意事项

1. **Product ID 一致性**：同一套餐层级的所有价格（月付、年付）必须使用相同的 `stripe_product_id`

2. **recurring_interval**：必须是 `"month"` 或 `"year"`（小写）

3. **benefits_jsonb**：需要根据实际业务填写每个套餐的权益（如积分数量）

4. **环境区分**：测试环境使用 `environment: "development"`，生产环境使用 `environment: "production"`

5. **价格格式**：数据库中的 `price` 字段存储为字符串格式的数字（如 "29.99"），不是美分

---

## 🔗 相关文档

- 官方 Stripe 文档: https://docs.stripe.com
- 本项目本地 Stripe CLI 指南: `STRIPE_CLI_SETUP.md`
- 项目支付规则：`.cursor/rules/09-payments.mdc`
- 环境变量参考：`.cursor/rules/12-env-variables.mdc`
