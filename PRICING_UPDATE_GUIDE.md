# 定价计划更新指南

## 已完成的工作

### 1. 前端组件更新 ✅
- **PricingCardDisplay 组件** (`components/home/PricingCardDisplay.tsx`)
  - 已添加积分显示功能
  - 自动从 `plan.benefitsJsonb` 读取积分信息
  - 根据支付类型显示：
    - 月付/年付: "X credits/month"
    - 一次性: "X credits"

### 2. Stripe Webhook CLI ✅
- 已启动 Stripe webhook CLI，转发到 `localhost:3000/api/stripe/webhook`
- **重要**: CLI 启动后会显示新的 webhook secret，需要更新到 `.env.local` 中的 `STRIPE_WEBHOOK_SECRET`

## 需要手动完成的工作

### 更新数据库中的定价计划

有两种方式更新定价计划：

#### 方式 1: 通过 Admin Dashboard（推荐）

1. 访问 `/dashboard/prices`
2. 编辑每个定价计划
3. 在 "Benefits JSON" 字段中更新积分配置：

**月付计划**:
```json
{
  "monthlyCredits": 3000
}
```
或
```json
{
  "monthlyCredits": 110000
}
```
或
```json
{
  "monthlyCredits": 24000
}
```

**年付计划**:
```json
{
  "monthlyCredits": 3000,
  "totalMonths": 12
}
```
或
```json
{
  "monthlyCredits": 110000,
  "totalMonths": 12
}
```
或
```json
{
  "monthlyCredits": 24000,
  "totalMonths": 12
}
```

**一次性计划**:
```json
{
  "oneTimeCredits": 5000
}
```

#### 方式 2: 使用 SQL 脚本

1. 查看 `scripts/update-pricing-plans.sql`
2. 根据你的实际定价计划 ID 和价格修改 SQL 语句
3. 在数据库中执行 SQL 脚本

**注意**: SQL 脚本中的价格匹配条件可能需要根据实际情况调整。

## 定价计划配置参考

### 月付计划
- **$29.99/月** → 3000 积分/月
- **$99.99/月** → 110000 积分/月 (100000 * 1.1)
- **$199.99/月** → 24000 积分/月 (20000 * 1.2)

### 年付计划（每月分配相同积分）
- **$299.9/年** → 3000 积分/月（共12个月）
- **$999.9/年** → 110000 积分/月（共12个月）
- **$1999.9/年** → 24000 积分/月（共12个月）

### 一次性计划
- **$49.99** → 5000 积分

## 验证步骤

1. **检查前端显示**:
   - 访问首页，查看定价卡片是否显示积分信息
   - 检查积分数量是否正确

2. **检查数据库**:
   ```sql
   SELECT 
     id,
     card_title,
     price,
     payment_type,
     recurring_interval,
     benefits_jsonb
   FROM pricing_plans
   WHERE environment = 'test'
   ORDER BY payment_type, recurring_interval, price;
   ```

3. **测试 Stripe Webhook**:
   - 确保 Stripe CLI 正在运行
   - 在 Stripe Dashboard 创建测试支付
   - 验证 webhook 事件是否正确接收
   - 验证积分是否正确分配

## 注意事项

1. **Webhook Secret**: Stripe CLI 启动后会显示新的 webhook secret，需要更新到环境变量中
2. **环境区分**: 确保更新的是 `test` 环境的定价计划（开发环境）
3. **年付积分分配**: 系统会自动按月分配积分，只需设置 `monthlyCredits` 和 `totalMonths: 12`
4. **价格格式**: 数据库中的价格是字符串格式（如 "29.99"），不是数字

## 相关文件

- `components/home/PricingCardDisplay.tsx` - 定价卡片显示组件
- `components/nanabananvideo/Pricing.tsx` - NanoBananaVideo 定价组件
- `scripts/update-pricing-plans.sql` - SQL 更新脚本
- `lib/payments/credit-manager.ts` - 积分分配逻辑
- `.cursor/rules/09-payments.mdc` - 支付系统架构文档

