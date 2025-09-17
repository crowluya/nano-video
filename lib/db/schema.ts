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

export const pricingPlans = pgTable('pricing_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  environment: pricingPlanEnvironmentEnum('environment').notNull(),
  cardTitle: text('card_title').notNull(),
  cardDescription: text('card_description'),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),
  stripeCouponId: varchar('stripe_coupon_id', { length: 255 }),
  enableManualInputCoupon: boolean('enable_manual_input_coupon')
    .default(false)
    .notNull(),
  paymentType: varchar('payment_type', { length: 50 }),
  recurringInterval: varchar('recurring_interval', { length: 50 }),
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
    status: text('status').notNull(),
    orderType: text('order_type').notNull(),
    productId: text('product_id'),
    planId: uuid('plan_id').references(() => pricingPlans.id, {
      onDelete: 'set null',
    }),
    priceId: varchar('price_id', { length: 255 }),
    amountSubtotal: numeric('amount_subtotal'),
    amountDiscount: numeric('amount_discount').default('0'),
    amountTax: numeric('amount_tax').default('0'),
    amountTotal: numeric('amount_total').notNull(),
    currency: varchar('currency', { length: 10 }).notNull(),
    subscriptionProviderId: text('subscription_provider_id'),
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
    stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    priceId: varchar('price_id', { length: 255 }).notNull(),
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

export const postStatusEnum = pgEnum('post_status', [
  'draft',
  'published',
  'archived',
])

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
    publishedAt: timestamp('published_at', { withTimezone: true }),
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
      languageSlugUnique: unique('posts_language_slug_unique').on(
        table.language,
        table.slug
      ),
      authorIdIdx: index('idx_posts_author_id').on(table.authorId),
      statusIdx: index('idx_posts_status').on(table.status),
      visibilityIdx: index('idx_posts_visibility').on(table.visibility),
      languageStatusIdx: index('idx_posts_language_status').on(
        table.language,
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
