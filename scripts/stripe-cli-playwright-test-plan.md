# Stripe CLI + Playwright 本地订阅测试手册

这份文档是给 `GLM + Playwright` 用的本地联调说明，目标是验证：

1. Stripe Checkout 订阅下单是否成功
2. Stripe webhook 是否正确写入 `subscriptions` / `orders`
3. 积分是否正确发放到 `usage`
4. 订阅变更、取消、退款时积分是否按预期变化

这份手册只针对当前项目里的 `Stripe` 逻辑，不覆盖 `Creem`。

## 一、先明确测试边界

这个项目里，订阅与积分链路不是单点逻辑，而是下面这条链：

1. 前端价格卡点击购买
2. `POST /api/payment/checkout-session`
3. 跳转到 Stripe Checkout
4. Stripe 向本地 `POST /api/stripe/webhook`
5. webhook 写入 `subscriptions` / `orders`
6. webhook 调用积分逻辑，更新 `usage` / `credit_logs`
7. 成功页和 `/dashboard/subscription` 显示结果

所以真正要测的是“端到端链路”，不是只测某一个 webhook handler。

## 二、必须遵守的测试原则

### 1. 主流程不要只用 `stripe trigger`

`stripe trigger invoice.paid` / `stripe trigger customer.subscription.updated` 这种命令，只适合做 webhook 端点通不通的烟测。

原因：

- 它生成的是 Stripe 的测试事件，不一定对应你刚刚在浏览器里创建的那个真实 subscription
- 当前项目很多逻辑依赖真实 `subscriptionId`、`customerId`、`priceId`、`metadata.userId`、本地数据库已有记录
- 如果只跑 `stripe trigger`，很容易出现“webhook 收到了，但积分判断上下文不对”的假阳性或假阴性

结论：

- `真实 Checkout + Stripe CLI 转发 webhook` 才是主流程测试
- `stripe trigger` 只能用来补充做 webhook 连通性烟测

### 2. 尽量使用全新测试账号

不要复用已经有活跃订阅、旧 `stripe_customer_id`、旧 `usage` 余额的账号。

建议：

- 每个场景用一个全新的测试邮箱
- 或者至少保证这个账号没有历史活跃订阅

否则很难判断积分变化到底来自这次测试，还是旧数据残留。

### 3. 这次测试只用 Stripe `test mode`

本地 `.env.local` 必须使用 Stripe 测试密钥。

不要在本地联调时混用：

- 本地数据库 + Stripe live key
- 本地页面 + 线上 webhook
- 线上数据库 + 本地测试账号

## 三、项目内你真正要观察的对象

### 前端页面

- 首页价格区：`/#pricing`
- 支付成功页：`/payment/success?session_id=...&provider=stripe`
- 订阅页：`/dashboard/subscription`

### 后端关键表

- `subscriptions`
- `orders`
- `usage`
- `credit_logs`

### 当前项目内对应代码

- Checkout 入口：`components/home/PricingCTA.tsx`
- 创建 Stripe Checkout Session：`app/api/payment/checkout-session/route.ts`
- Stripe webhook 路由：`app/api/stripe/webhook/route.ts`
- Stripe webhook 处理：`app/api/stripe/webhook/webhook-handlers.ts`
- 订阅变更处理：`app/api/stripe/webhook/subscription-change.ts`
- 积分发放/撤销：`lib/payments/credit-manager.ts`
- 订阅页展示：`app/[locale]/(protected)/dashboard/(user)/subscription/page.tsx`

## 四、启动方式

### Terminal A: 启动本地应用

```bash
pnpm dev
```

默认本地地址按 `http://localhost:3000` 处理。

### Terminal B: 启动 Stripe CLI webhook 转发

只转发当前项目真正处理的事件：

```bash
stripe listen --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed,charge.refunded,radar.early_fraud_warning.created --forward-to localhost:3000/api/stripe/webhook
```

启动后 Stripe CLI 会打印一个新的 `whsec_...`。

要求：

1. 把这个 `whsec_...` 写到本地 `.env.local` 的 `STRIPE_WEBHOOK_SECRET`
2. 重启 `pnpm dev`

如果这一步没做，浏览器下单成功也不会正确触发本地积分逻辑。

### Terminal C: 可选日志观察

```bash
stripe logs tail
```

作用：

- 看 Stripe API 请求是否报错
- 看 `No such customer`、`No such price`、支付失败等问题

## 五、Playwright 执行约束

GLM 使用 Playwright 时，按下面的角色分工执行：

- Playwright 负责浏览器动作和页面断言
- Stripe CLI 负责把 webhook 转发到本地
- 数据验收优先看页面，其次看数据库

如果 GLM 只能控制浏览器，不能开终端，那么至少要由人工先把 `pnpm dev` 和 `stripe listen` 启起来，再让 GLM 开始浏览器测试。

## 六、支付测试卡

Stripe 官方测试卡：

- 卡号：`4242 4242 4242 4242`
- 到期日：任意未来日期
- CVC：任意 3 位
- 邮编：任意，例如 `90210`

如果 Checkout 页面要求邮箱，就填当前测试账号邮箱。

## 七、推荐测试矩阵

至少覆盖下面 4 个场景。

### 场景 A：新订阅购买，检查首次积分发放

这是最重要的场景，必须先通过。

#### 前置条件

- 使用全新测试账号
- 该账号没有旧订阅
- 本地价格区能看到 Stripe 订阅卡
- 选的 plan 必须是 `provider = stripe` 且 `paymentType = recurring`

#### Playwright 步骤

1. 打开首页
2. 登录测试账号
3. 滚动到 `#pricing`
4. 找到一个 Stripe 月付或年付订阅卡
5. 点击购买按钮
6. 跳转到 Stripe Checkout
7. 填入测试卡并完成支付
8. 等待跳回本地成功页
9. 再打开 `/dashboard/subscription`

#### 浏览器断言

支付完成后，至少满足下面几点：

- URL 包含 `/payment/success`
- URL 查询参数里有 `provider=stripe`
- `/dashboard/subscription` 页面出现 `Subscription`
- 页面出现 `Renewal:`
- 页面出现 `Credits:`
- `Credits` 值大于 `0`

#### 数据验收标准

这一步如果有终端能力，必须补看数据库：

- `subscriptions` 新增 1 条当前用户的 Stripe 订阅记录
- `orders` 至少新增 1 条 `subscription_create` 或初始订阅订单
- `usage.subscription_credits_balance` 变成该计划对应的积分
- `credit_logs` 新增 1 条 `subscription_grant`

#### 预期说明

- 月付计划：`usage.subscription_credits_balance` 应被重置为该月额度
- 年付计划：首次只发当月额度，同时 `balance_jsonb.yearlyAllocationDetails` 应初始化

### 场景 B：升级订阅，检查补差积分

这个场景用来验证 `customer.subscription.updated` 和 `subscription_change` 逻辑。

#### 前置条件

- 先完成场景 A
- 当前账号已有一个活跃 Stripe 订阅
- 订阅页能打开 Stripe Portal

#### Playwright 步骤

1. 打开 `/dashboard/subscription`
2. 点击 `Manage` / Stripe Portal 按钮
3. 在 Stripe Portal 中把当前套餐升级到更高额度套餐
4. 完成变更
5. 回到本地 `/dashboard/subscription`

#### 浏览器断言

- 订阅仍然是激活状态
- `Credits:` 数字发生变化
- 升级后 `Credits` 不应小于升级前

#### 数据验收标准

- `subscriptions.price_id` / `plan_id` 已更新
- `usage.subscription_credits_balance` 已按升级逻辑调整
- `credit_logs` 新增一条与订阅变更有关的记录

#### 说明

这里不要用 `stripe trigger customer.subscription.updated` 代替真实升级。
必须从真实 Stripe Portal 改套餐，否则 `previous_attributes`、价格切换、账单原因可能都不对。

### 场景 C：降级订阅，检查是否错误回收积分

这个场景验证降级逻辑是否稳定。

#### Playwright 步骤

1. 基于场景 B 的账号继续操作
2. 打开 Stripe Portal
3. 将当前套餐降级
4. 返回 `/dashboard/subscription`

#### 浏览器断言

- 页面仍能正常加载订阅信息
- `Credits:` 存在且不是负数

#### 数据验收标准

- `subscriptions` 已切换到新 plan
- `usage.subscription_credits_balance` 不应出现负数
- `balance_jsonb` 的月付或年付结构仍然有效

### 场景 D：取消订阅或立即结束订阅，检查剩余积分撤销

这个场景验证 `customer.subscription.deleted` 和剩余积分撤销。

#### Playwright 步骤

1. 基于已有活跃订阅账号
2. 打开 Stripe Portal
3. 取消订阅
4. 如果 Portal 只是 `cancel_at_period_end`，则去 Stripe Dashboard 或 CLI 做“立即结束”
5. 刷新 `/dashboard/subscription`

#### 浏览器断言

- 页面不再显示活跃会员态
- 或者不再显示原来的 `Credits: N`

#### 数据验收标准

- `subscriptions.status` 变成非活跃状态
- `usage.subscription_credits_balance` 变成 `0`
- `credit_logs` 新增 `subscription_ended_revoke`

## 八、可选场景：退款

退款更适合人工配合 Stripe Dashboard 或 Stripe CLI，不建议只让 Playwright 负责。

适合验证：

- `charge.refunded`
- `revokeSubscriptionCredits`

#### 验收标准

- 被退款订单状态更新
- `usage.subscription_credits_balance` 或 `usage.one_time_credits_balance` 回收
- `credit_logs` 新增负数记录

## 九、GLM/Playwright 的建议执行顺序

建议按这个顺序跑，不要乱序：

1. 场景 A：新购订阅
2. 场景 B：升级
3. 场景 C：降级
4. 场景 D：取消

原因：

- A 用来确认基础链路
- B/C 用来确认订阅变更
- D 用来确认撤权

如果 A 都不过，后面的结论都不可信。

## 十、每个场景要记录什么

GLM 在每次测试结束后，至少要记录下面这些信息：

- 测试账号邮箱
- 使用的 plan 名称
- Stripe Checkout 是否成功完成
- 成功页 URL
- 订阅页 `Credits` 数字
- Stripe CLI 是否收到对应 webhook
- 是否有异常 toast、500、重定向错误

如果能拿到终端输出，再补：

- `invoice.paid` 是否返回 `200`
- `customer.subscription.updated` 是否返回 `200`
- 是否出现 `No such customer` / `No such price` / `Webhook Error`

## 十一、推荐的数据库核对方式

如果执行环境允许开终端，可以在每个场景后补做数据库检查。

仓库里现成可复用的脚本：

```bash
pnpm exec tsx scripts/check-pricing-plans.ts
pnpm exec tsx scripts/check-recent-orders.ts
pnpm exec tsx scripts/check-user-subscription.ts
```

注意：

- 这几个脚本目前更偏“人工辅助检查”
- 不是严格按邮箱过滤的自动化断言
- 所以它们适合调试，不适合直接当最终自动化判定标准

## 十二、GLM/Playwright 不要做的事

### 不要 1：不要把 webhook 成败只看成功页

成功页只能证明 Checkout 完成，不能证明：

- `orders` 已写入
- `subscriptions` 已同步
- `usage` 已发放积分

所以必须再看 `/dashboard/subscription`，最好再配合数据库。

### 不要 2：不要把 `stripe trigger` 当成真实业务验收

再次强调：

- `stripe trigger` 只能做连通性烟测
- 业务验收必须用真实 Checkout 创建出来的真实订阅

### 不要 3：不要复用一个脏账号一直点

订阅、积分、旧 customer、旧 usage 会互相污染，结果不可信。

## 十三、最小通过标准

如果只做一轮最小可用验证，至少要满足：

1. 新账号完成一次真实 Stripe Checkout 订阅支付
2. Stripe CLI 把 `invoice.paid` 和 `customer.subscription.created` 转发到本地
3. `/dashboard/subscription` 出现 `Renewal` 和大于 `0` 的 `Credits`
4. 数据库中出现对应的 `subscriptions`、`orders`、`credit_logs`

这 4 条都满足，才能说明“本地订阅与首次积分发放逻辑基本正常”。

## 十四、官方参考

只看官方原始文档：

- Stripe CLI 本地转发 webhook：https://docs.stripe.com/webhooks/test
- Stripe CLI 用法：https://docs.stripe.com/stripe-cli/use-cli
- Checkout 本地联调与测试卡：https://docs.stripe.com/checkout/fulfillment
- Stripe 测试卡文档：https://docs.stripe.com/testing

## 十五、给 GLM 的一句话执行指令

如果你要把这份文档直接交给 GLM，可以这样下指令：

“按照 `scripts/stripe-cli-playwright-test-plan.md` 的场景 A -> B -> C -> D 顺序执行。浏览器操作使用 Playwright，前提是假设本地 `pnpm dev` 和 `stripe listen` 已经由人工启动。每个场景都记录成功页 URL、订阅页 Credits 数值、是否出现报错，并在发现异常时停止继续下一个场景。”
