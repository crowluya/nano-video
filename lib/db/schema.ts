import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin'])

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(), // better-auth
  name: text("name"), // better-auth
  image: text("image"), // better-auth
  role: userRoleEnum('role').default('user').notNull(),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  referral: text('referral'),
  stripeCustomerId: text("stripe_customer_id").unique(),
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const session = pgTable("session", {
  id: uuid('id').primaryKey().defaultRandom(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const pricingPlanEnvironmentEnum = pgEnum('pricing_plan_environment', [
  'test',
  'live',
])

export const providerEnum = pgEnum('provider', [
  'none', // no payment feature
  'stripe',
  'creem',
])
export type PaymentProvider = (typeof providerEnum.enumValues)[number]

export const paymentTypeEnum = pgEnum('payment_type', [
  'one_time', // stripe
  'onetime', // creem
  'recurring', // stripe and creem
])
export type PaymentType = (typeof paymentTypeEnum.enumValues)[number]

export const recurringIntervalEnum = pgEnum('recurring_interval', [
  'month', // stripe
  'year', // stripe
  'every-month', // creem recurring
  'every-year', // creem recurring
  'once', // creem onetime
])
export type RecurringInterval = (typeof recurringIntervalEnum.enumValues)[number]

export const pricingPlans = pgTable('pricing_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  environment: pricingPlanEnvironmentEnum('environment').notNull(),
  cardTitle: text('card_title').notNull(),
  cardDescription: text('card_description'),
  provider: providerEnum('provider').default('none'),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),
  stripeCouponId: varchar('stripe_coupon_id', { length: 255 }),
  creemProductId: varchar('creem_product_id', { length: 255 }),
  creemDiscountCode: varchar('creem_discount_code', { length: 255 }),
  enableManualInputCoupon: boolean('enable_manual_input_coupon')
    .default(false)
    .notNull(),
  // paymentType: varchar('payment_type', { length: 50 }),
  paymentType: paymentTypeEnum('payment_type'),
  // recurringInterval: varchar('recurring_interval', { length: 50 }),
  recurringInterval: recurringIntervalEnum('recurring_interval'),
  trialPeriodDays: integer('trial_period_days'),
  price: numeric('price'),
  currency: varchar('currency', { length: 10 }),
  displayPrice: varchar('display_price', { length: 50 }),
  originalPrice: varchar('original_price', { length: 50 }),
  priceSuffix: varchar('price_suffix', { length: 100 }),
  features: jsonb('features').default('[]').notNull(),
  isHighlighted: boolean('is_highlighted').default(false).notNull(),
  highlightText: text('highlight_text'),
  buttonText: text('button_text'),
  buttonLink: text('button_link'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  langJsonb: jsonb('lang_jsonb').default('{}').notNull(),
  benefitsJsonb: jsonb('benefits_jsonb').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    provider: text('provider').notNull(),
    providerOrderId: text('provider_order_id').notNull(),
    orderType: text('order_type').notNull(),
    status: text('status').notNull(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeInvoiceId: text('stripe_invoice_id'),
    stripeChargeId: text('stripe_charge_id'),
    subscriptionId: text('subscription_id'),
    planId: uuid('plan_id').references(() => pricingPlans.id, {
      onDelete: 'set null',
    }),
    productId: text('product_id'),
    priceId: varchar('price_id', { length: 255 }),
    amountSubtotal: numeric('amount_subtotal'),
    amountDiscount: numeric('amount_discount').default('0'),
    amountTax: numeric('amount_tax').default('0'),
    amountTotal: numeric('amount_total').notNull(),
    currency: varchar('currency', { length: 10 }).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      userIdx: index('idx_orders_user_id').on(table.userId),
      providerIdx: index('idx_orders_provider').on(table.provider),
      planIdIdx: index('idx_orders_plan_id').on(table.planId),
      providerProviderOrderIdUnique: unique(
        'idx_orders_provider_provider_order_id_unique'
      ).on(table.provider, table.providerOrderId),
    }
  }
)

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    planId: uuid('plan_id')
      .references(() => pricingPlans.id, { onDelete: 'restrict' })
      .notNull(),
    provider: providerEnum('provider').notNull(),
    subscriptionId: text('subscription_id').notNull().unique(),
    customerId: text('customer_id').notNull(),
    productId: text('product_id'),
    priceId: varchar('price_id'),
    status: text('status').notNull(),
    currentPeriodStart: timestamp('current_period_start', {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    trialStart: timestamp('trial_start', { withTimezone: true }),
    trialEnd: timestamp('trial_end', { withTimezone: true }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      userIdx: index('idx_subscriptions_user_id').on(table.userId),
      subscriptionIdIdx: index('idx_subscriptions_subscription_id').on(table.subscriptionId),
      statusIdx: index('idx_subscriptions_status').on(table.status),
      planIdIdx: index('idx_subscriptions_plan_id').on(table.planId),
    }
  }
)

export const usage = pgTable('usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  subscriptionCreditsBalance: integer('subscription_credits_balance')
    .default(0)
    .notNull(),
  oneTimeCreditsBalance: integer('one_time_credits_balance')
    .default(0)
    .notNull(),
  balanceJsonb: jsonb('balance_jsonb').default('{}').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const creditLogs = pgTable(
  'credit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    amount: integer('amount').notNull(),
    oneTimeBalanceAfter: integer('one_time_balance_after').notNull(),
    subscriptionBalanceAfter: integer('subscription_balance_after').notNull(),
    type: text('type').notNull(),
    notes: text('notes'),
    relatedOrderId: uuid('related_order_id').references(() => orders.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      userIdx: index('idx_credit_logs_user_id').on(table.userId),
      typeIdx: index('idx_credit_logs_type').on(table.type),
      relatedOrderIdIdx: index('idx_credit_logs_related_order_id').on(
        table.relatedOrderId
      ),
    }
  }
)

export const postTypeEnum = pgEnum('post_type', [
  'blog',
])
export type PostType = (typeof postTypeEnum.enumValues)[number]

export const postStatusEnum = pgEnum('post_status', [
  'draft',
  'published',
  'archived',
])
export type PostStatus = (typeof postStatusEnum.enumValues)[number]

export const postVisibilityEnum = pgEnum('post_visibility', [
  'public',
  'logged_in',
  'subscribers',
])

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    language: varchar('language', { length: 10 }).notNull(),
    postType: postTypeEnum('post_type').default('blog'),
    authorId: uuid('author_id')
      .references(() => user.id, { onDelete: 'set null' })
      .notNull(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content: text('content'),
    description: text('description'),
    featuredImageUrl: text('featured_image_url'),
    isPinned: boolean('is_pinned').default(false).notNull(),
    status: postStatusEnum('status').default('draft').notNull(),
    visibility: postVisibilityEnum('visibility').default('public').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      languageSlugPostTypeUnique: unique('posts_language_slug_post_type_unique').on(
        table.language,
        table.slug,
        table.postType
      ),
      authorIdIdx: index('idx_posts_author_id').on(table.authorId),
      postTypeIdx: index('idx_posts_post_type').on(table.postType),
      statusIdx: index('idx_posts_status').on(table.status),
      visibilityIdx: index('idx_posts_visibility').on(table.visibility),
      languageStatusIdx: index('idx_posts_language_status').on(
        table.language,
        table.status
      ),
      languagePostTypeStatusIdx: index('idx_posts_language_post_type_status').on(
        table.language,
        table.postType,
        table.status
      ),
    }
  }
)

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    postType: postTypeEnum('post_type').default('blog'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      nameIdx: index('idx_tags_name').on(table.name),
    }
  }
)

export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .references(() => posts.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.postId, table.tagId] }),
      postIdIdx: index('idx_post_tags_post_id').on(table.postId),
      tagIdIdx: index('idx_post_tags_tag_id').on(table.tagId),
    }
  }
)

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    metadata: jsonb('metadata').default('{}').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      userIdx: index('idx_activity_logs_user_id').on(table.userId),
      actionIdx: index('idx_activity_logs_action').on(table.action),
      createdAtIdx: index('idx_activity_logs_created_at').on(table.createdAt),
    }
  }
)

export const taskCreditMappings = pgTable(
  'task_credit_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: text('task_id').notNull(),
    creditLogId: uuid('credit_log_id')
      .references(() => creditLogs.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    refunded: boolean('refunded').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      taskIdIdx: index('idx_task_credit_mappings_task_id').on(table.taskId),
      creditLogIdIdx: index('idx_task_credit_mappings_credit_log_id').on(table.creditLogId),
      userIdIdx: index('idx_task_credit_mappings_user_id').on(table.userId),
      taskIdUnique: unique('idx_task_credit_mappings_task_id_unique').on(table.taskId),
    }
  }
)