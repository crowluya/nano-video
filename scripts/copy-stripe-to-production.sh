#!/bin/bash

# Stripe 测试环境产品复制到生产环境脚本
# 使用方法: ./scripts/copy-stripe-to-production.sh

set -e

echo "🚀 开始复制 Stripe 产品和价格到生产环境..."
echo ""
echo "⚠️  警告: 此操作将在生产环境创建新的产品和价格"
echo "请确认你已经切换到生产环境 (Live Mode)"
echo ""
read -p "是否继续? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo ""
echo "📦 步骤 1: 创建产品..."
echo ""

# 1. Basic Plan
echo "创建 Basic Plan..."
BASIC_PRODUCT=$(stripe products create \
  --name="Basic Plan" \
  --description="基础套餐 - 适合个人用户" \
  --type=service \
  --tax-code=txcd_10000000 \
  --format=json)

BASIC_PRODUCT_ID=$(echo $BASIC_PRODUCT | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Basic Plan 创建成功: $BASIC_PRODUCT_ID"

# 2. Standard Plan
echo "创建 Standard Plan..."
STANDARD_PRODUCT=$(stripe products create \
  --name="Standard Plan" \
  --description="专业套餐 - 适合小团队" \
  --type=service \
  --tax-code=txcd_10000000 \
  --format=json)

STANDARD_PRODUCT_ID=$(echo $STANDARD_PRODUCT | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Standard Plan 创建成功: $STANDARD_PRODUCT_ID"

# 3. Ultra Plan
echo "创建 Ultra Plan..."
ULTRA_PRODUCT=$(stripe products create \
  --name="Ultra Plan" \
  --description="企业套餐 - 适合大型团队" \
  --type=service \
  --tax-code=txcd_10000000 \
  --format=json)

ULTRA_PRODUCT_ID=$(echo $ULTRA_PRODUCT | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Ultra Plan 创建成功: $ULTRA_PRODUCT_ID"

# 4. One-Time Payment
echo "创建 One-Time Payment..."
ONETIME_PRODUCT=$(stripe products create \
  --name="One-Time Payment" \
  --description="一次性支付" \
  --type=service \
  --tax-code=txcd_10000000 \
  --format=json)

ONETIME_PRODUCT_ID=$(echo $ONETIME_PRODUCT | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ One-Time Payment 创建成功: $ONETIME_PRODUCT_ID"

echo ""
echo "💰 步骤 2: 创建价格..."
echo ""

# Basic Plan - 月付 ($29.99)
echo "创建 Basic Plan 月付价格..."
BASIC_MONTHLY=$(stripe prices create \
  --product=$BASIC_PRODUCT_ID \
  --unit-amount=2999 \
  --currency=usd \
  --recurring[interval]=month \
  --tax-behavior=inclusive \
  --format=json)

BASIC_MONTHLY_ID=$(echo $BASIC_MONTHLY | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Basic 月付: $BASIC_MONTHLY_ID"

# Basic Plan - 年付 ($299.90)
echo "创建 Basic Plan 年付价格..."
BASIC_YEARLY=$(stripe prices create \
  --product=$BASIC_PRODUCT_ID \
  --unit-amount=29990 \
  --currency=usd \
  --recurring[interval]=year \
  --tax-behavior=inclusive \
  --format=json)

BASIC_YEARLY_ID=$(echo $BASIC_YEARLY | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Basic 年付: $BASIC_YEARLY_ID"

# Standard Plan - 月付 ($99.99)
echo "创建 Standard Plan 月付价格..."
STANDARD_MONTHLY=$(stripe prices create \
  --product=$STANDARD_PRODUCT_ID \
  --unit-amount=9999 \
  --currency=usd \
  --recurring[interval]=month \
  --tax-behavior=exclusive \
  --format=json)

STANDARD_MONTHLY_ID=$(echo $STANDARD_MONTHLY | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Standard 月付: $STANDARD_MONTHLY_ID"

# Standard Plan - 年付 ($999.90)
echo "创建 Standard Plan 年付价格..."
STANDARD_YEARLY=$(stripe prices create \
  --product=$STANDARD_PRODUCT_ID \
  --unit-amount=99990 \
  --currency=usd \
  --recurring[interval]=year \
  --tax-behavior=inclusive \
  --format=json)

STANDARD_YEARLY_ID=$(echo $STANDARD_YEARLY | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Standard 年付: $STANDARD_YEARLY_ID"

# Ultra Plan - 月付 ($199.99)
echo "创建 Ultra Plan 月付价格..."
ULTRA_MONTHLY=$(stripe prices create \
  --product=$ULTRA_PRODUCT_ID \
  --unit-amount=19999 \
  --currency=usd \
  --recurring[interval]=month \
  --tax-behavior=exclusive \
  --format=json)

ULTRA_MONTHLY_ID=$(echo $ULTRA_MONTHLY | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Ultra 月付: $ULTRA_MONTHLY_ID"

# Ultra Plan - 年付 ($1,999.90)
echo "创建 Ultra Plan 年付价格..."
ULTRA_YEARLY=$(stripe prices create \
  --product=$ULTRA_PRODUCT_ID \
  --unit-amount=199990 \
  --currency=usd \
  --recurring[interval]=year \
  --tax-behavior=inclusive \
  --format=json)

ULTRA_YEARLY_ID=$(echo $ULTRA_YEARLY | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Ultra 年付: $ULTRA_YEARLY_ID"

# One-Time Payment ($49.99)
echo "创建 One-Time Payment 价格..."
ONETIME_PRICE=$(stripe prices create \
  --product=$ONETIME_PRODUCT_ID \
  --unit-amount=4999 \
  --currency=usd \
  --tax-behavior=inclusive \
  --format=json)

ONETIME_PRICE_ID=$(echo $ONETIME_PRICE | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ One-Time: $ONETIME_PRICE_ID"

echo ""
echo "✅ 所有产品和价格创建完成!"
echo ""
echo "📋 生产环境 Product IDs 和 Price IDs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Basic Plan"
echo "   Product ID: $BASIC_PRODUCT_ID"
echo "   月付 Price ID: $BASIC_MONTHLY_ID"
echo "   年付 Price ID: $BASIC_YEARLY_ID"
echo ""
echo "2. Standard Plan"
echo "   Product ID: $STANDARD_PRODUCT_ID"
echo "   月付 Price ID: $STANDARD_MONTHLY_ID"
echo "   年付 Price ID: $STANDARD_YEARLY_ID"
echo ""
echo "3. Ultra Plan"
echo "   Product ID: $ULTRA_PRODUCT_ID"
echo "   月付 Price ID: $ULTRA_MONTHLY_ID"
echo "   年付 Price ID: $ULTRA_YEARLY_ID"
echo ""
echo "4. One-Time Payment"
echo "   Product ID: $ONETIME_PRODUCT_ID"
echo "   Price ID: $ONETIME_PRICE_ID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 下一步:"
echo "1. 将以上 IDs 保存到安全的地方"
echo "2. 更新生产数据库 pricing_plans 表"
echo "3. 更新生产环境变量"
echo "4. 配置生产环境 Webhook"
echo ""
