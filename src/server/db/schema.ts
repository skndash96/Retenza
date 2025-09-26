import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  varchar,
  jsonb,
  primaryKey,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
// ====================================================================================
// A. User Tables (Phone/Password Auth)
// ====================================================================================

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),

  phone_number: varchar("phone_number", { length: 20 }).unique().notNull(),
  hashed_password: text("hashed_password").notNull(),

  name: text("name").notNull(),
  address: text("address"),
  business_type: varchar("business_type", { length: 50 }),
  description: text("description"),
  email: varchar("email", { length: 255 }),
  contact_number: varchar("contact_number", { length: 20 }),
  contact_number_2: varchar("contact_number_2", { length: 20 }),
  region: varchar("region", { length: 100 }),
  gmap_link: varchar("gmap_link", { length: 500 }),
  logo_url: varchar("logo_url", { length: 500 }),
  additional_info: jsonb("additional_info").$type<Record<string, any>>().default({}),
  is_setup_complete: boolean("is_setup_complete").default(false),
  approved: boolean("approved").default(false).notNull(),
  user_id: integer("user_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),

  phone_number: varchar("phone_number", { length: 20 }).unique().notNull(),
  hashed_password: text("hashed_password").notNull(),

  name: text("name"),
  gender: varchar("gender", { length: 10 }).$type<'Male' | 'Female' | 'Other'>(),
  dob: timestamp("dob"),
  anniversary: timestamp("anniversary"),
  is_setup_complete: boolean("is_setup_complete").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ====================================================================================
// B. Loyalty Program & Rewards
// ====================================================================================

export type Tier = {
  id: number;
  name: string;
  points_to_unlock: number;
  rewards: {
    id: number; // Unique ID for each reward
    reward_type: 'cashback' | 'limited_usage' | 'custom';
    // Cashback reward fields
    percentage?: number;
    // Limited usage reward fields
    reward_text?: string;
    usage_limit_per_month?: number; // How many times per month (e.g., 2 = twice per month, 0.5 = bi-monthly)
    one_time?: boolean;
    // Custom reward fields
    name?: string;
    reward?: string;
  }[];
};

export const loyaltyPrograms = pgTable("loyalty_programs", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").notNull().unique(),
  points_rate: integer("points_rate").default(1).notNull(),
  description: text("description"),
  tiers: jsonb("tiers").$type<Tier[]>().notNull().default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ====================================================================================
// C. Customer Loyalty Status
// ====================================================================================

export const customerLoyalty = pgTable("customer_loyalty", {
  customer_id: integer("customer_id").notNull(),
  business_id: integer("business_id").notNull(),
  points: integer("points").default(0).notNull(),
  redeemable_points: decimal("redeemable_points", { precision: 10, scale: 2 }).default("0.00").notNull(),
  current_tier_name: varchar("current_tier_name", { length: 50 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.customer_id, t.business_id] }),
]);

// ====================================================================================
// D. Missions & Campaigns
// ====================================================================================

export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  offer: text("offer").notNull(),
  applicable_tiers: jsonb("applicable_tiers").$type<string[]>().notNull().default([]),
  filters: jsonb("filters").$type<{
    gender?: ('Male' | 'Female' | 'Other')[];
    age_range?: { min: number; max: number };
    location?: string[];
    customer_type?: string[];
  }>().default({}),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at").notNull(),
});

// ====================================================================================
// E. Transactions
// ====================================================================================

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull(),
  business_id: integer("business_id").notNull(),
  bill_amount: decimal("bill_amount", { precision: 10, scale: 2 }).notNull(),
  points_awarded: integer("points_awarded").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ====================================================================================
// F. Reward Redemptions
// ====================================================================================

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull(),
  business_id: integer("business_id").notNull(),
  reward_id: text("reward_id").notNull(),
  reward_type: varchar("reward_type", { length: 50 }).notNull(),
  reward_value: decimal("reward_value", { precision: 10, scale: 2 }).notNull(),
  transaction_id: integer("transaction_id").notNull(),
  redeemed_at: timestamp("redeemed_at").defaultNow().notNull(),
});

// ====================================================================================
// G. Sessions
// ====================================================================================

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: integer("user_id").notNull(),
  role: text('role', { enum: ['business', 'user'] }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// ====================================================================================
// H. Push Notifications
// ====================================================================================

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull(),
  business_id: integer("business_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull(),
  business_id: integer("business_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'points_earned', 'reward_unlocked', 'goal_nudge', 'inactivity_winback', 'trending_missions', 'tier_rewards'
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data").$type<Record<string, any>>().default({}),
  is_read: boolean("is_read").default(false),
  sent_at: timestamp("sent_at").defaultNow().notNull(),
  read_at: timestamp("read_at"),
});

// ====================================================================================
// I. Mission Registry
// ====================================================================================

export const missionRegistry = pgTable("mission_registry", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull(),
  mission_id: integer("mission_id").notNull(),
  business_id: integer("business_id").notNull(),
  status: text("status").notNull().$type<'in_progress' | 'completed' | 'failed'>(),
  started_at: timestamp("started_at").defaultNow(),
  completed_at: timestamp("completed_at"),
  discount_amount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  discount_percentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default('0'),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ====================================================================================
// J. Drizzle Relations 
// ====================================================================================

export const businessRelations = relations(businesses, ({ one, many }) => ({
  loyaltyProgram: one(loyaltyPrograms, {
    fields: [businesses.id],
    references: [loyaltyPrograms.business_id],
  }),
  customerLoyalty: many(customerLoyalty),
  missions: many(missions),
  transactions: many(transactions),
  sessions: many(sessions),
  pushSubscriptions: many(pushSubscriptions),
  notifications: many(notifications),
}));

export const customerRelations = relations(customers, ({ many }) => ({
  customerLoyalty: many(customerLoyalty),
  transactions: many(transactions),
  sessions: many(sessions),
  pushSubscriptions: many(pushSubscriptions),
  notifications: many(notifications),
}));

export const customerLoyaltyRelations = relations(customerLoyalty, ({ one }) => ({
  customer: one(customers, {
    fields: [customerLoyalty.customer_id],
    references: [customers.id],
  }),
  business: one(businesses, {
    fields: [customerLoyalty.business_id],
    references: [businesses.id],
  }),
}));

export const loyaltyProgramRelations = relations(loyaltyPrograms, ({ one }) => ({
  business: one(businesses, {
    fields: [loyaltyPrograms.business_id],
    references: [businesses.id],
  }),
}));

export const missionRelations = relations(missions, ({ one }) => ({
  business: one(businesses, {
    fields: [missions.business_id],
    references: [businesses.id],
  }),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  customer: one(customers, {
    fields: [transactions.customer_id],
    references: [customers.id],
  }),
  business: one(businesses, {
    fields: [transactions.business_id],
    references: [businesses.id],
  }),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  business: one(businesses, {
    fields: [sessions.userId],
    references: [businesses.id],
  }),
  customer: one(customers, {
    fields: [sessions.userId],
    references: [customers.id],
  }),
}));

export const pushSubscriptionRelations = relations(pushSubscriptions, ({ one }) => ({
  customer: one(customers, {
    fields: [pushSubscriptions.customer_id],
    references: [customers.id],
  }),
  business: one(businesses, {
    fields: [pushSubscriptions.business_id],
    references: [businesses.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  customer: one(customers, {
    fields: [notifications.customer_id],
    references: [customers.id],
  }),
  business: one(businesses, {
    fields: [notifications.business_id],
    references: [businesses.id],
  }),
}));

export const missionRegistryRelations = relations(missionRegistry, ({ one }) => ({
  customer: one(customers, {
    fields: [missionRegistry.customer_id],
    references: [customers.id],
  }),
  mission: one(missions, {
    fields: [missionRegistry.mission_id],
    references: [missions.id],
  }),
  business: one(businesses, {
    fields: [missionRegistry.business_id],
    references: [businesses.id],
  }),
}));

export const schema = {
  businesses,
  customers,
  loyaltyPrograms,
  customerLoyalty,
  missions,
  transactions,
  rewardRedemptions,
  sessions,
  pushSubscriptions,
  notifications,
  missionRegistry,
};