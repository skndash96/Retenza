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

export type Business = typeof businesses.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type LoyaltyProgram = typeof loyaltyPrograms.$inferSelect;
export type CustomerLoyalty = typeof customerLoyalty.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type MissionRegistry = typeof missionRegistry.$inferSelect;

// ====================================================================================
// A. User Tables (Phone/Password Auth)
// ====================================================================================

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),

  phoneNumber: varchar("phone_number", { length: 20 }).unique().notNull(),
  hashedPassword: text("hashed_password").notNull(),

  name: text("name").notNull(),
  address: text("address"),
  businessType: varchar("business_type", { length: 50 }),
  description: text("description"),
  email: varchar("email", { length: 255 }),
  contactNumber: varchar("contact_number", { length: 20 }),
  contactNumber2: varchar("contact_number_2", { length: 20 }),
  gmapLink: varchar("gmap_link", { length: 500 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  additionalInfo: jsonb("additional_info").$type<Record<string, any>>().default({}),
  isSetupComplete: boolean("is_setup_complete").default(false),
  approved: boolean("approved").default(false).notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),

  phoneNumber: varchar("phone_number", { length: 20 }).unique().notNull(),
  hashedPassword: text("hashed_password").notNull(),

  name: text("name"),
  gender: varchar("gender", { length: 10 }).$type<'Male' | 'Female' | 'Other'>(),
  dob: timestamp("dob"),
  anniversary: timestamp("anniversary"),
  isSetupComplete: boolean("is_setup_complete").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  businessId: integer("business_id").notNull().unique(),
  pointsRate: integer("points_rate").default(1).notNull(),
  description: text("description"),
  tiers: jsonb("tiers").$type<Tier[]>().notNull().default([]),
});

// ====================================================================================
// C. Customer Loyalty Status
// ====================================================================================

export const customerLoyalty = pgTable("customer_loyalty", {
  customerId: integer("customer_id").notNull(),
  businessId: integer("business_id").notNull(),
  points: integer("points").default(0).notNull(),
  redeemablePoints: decimal("redeemable_points", { precision: 10, scale: 2 }).default("0.00").notNull(),
  currentTierName: varchar("current_tier_name", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.customerId, t.businessId] }),
]);

// ====================================================================================
// D. Missions & Campaigns
// ====================================================================================

export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  offer: text("offer").notNull(),
  applicableTiers: jsonb("applicable_tiers").$type<string[]>().notNull().default([]),
  filters: jsonb("filters").$type<{
    gender?: ('Male' | 'Female' | 'Other')[];
    age_range?: { min: number; max: number };
    location?: string[];
    customer_type?: string[];
  }>().default({}),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// ====================================================================================
// E. Transactions
// ====================================================================================

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  businessId: integer("business_id").notNull(),
  billAmount: decimal("bill_amount", { precision: 10, scale: 2 }).notNull(),
  pointsAwarded: integer("points_awarded").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ====================================================================================
// F. Reward Redemptions
// ====================================================================================

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  businessId: integer("business_id").notNull(),
  rewardId: text("reward_id").notNull(),
  rewardType: varchar("reward_type", { length: 50 }).notNull(),
  rewardValue: decimal("reward_value", { precision: 10, scale: 2 }).notNull(),
  transactionId: integer("transaction_id").notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
});

// ====================================================================================
// F. Sessions
// ====================================================================================

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: integer("user_id").notNull(),
  role: text('role', { enum: ['business', 'user'] }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// ====================================================================================
// G. Push Notifications
// ====================================================================================

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  businessId: integer("business_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  businessId: integer("business_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'points_earned', 'reward_unlocked', 'goal_nudge', 'inactivity_winback', 'trending_missions', 'tier_rewards'
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data").$type<Record<string, any>>().default({}),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

// ====================================================================================
// H. Mission Registry
// ====================================================================================

export const missionRegistry = pgTable("mission_registry", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  missionId: integer("mission_id").notNull(),
  businessId: integer("business_id").notNull(),
  status: text("status").notNull().$type<'in_progress' | 'completed' | 'failed'>(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default('0'),
  notes: text("notes"),
});

// ====================================================================================
// I. Drizzle Relations 
// ====================================================================================

export const businessRelations = relations(businesses, ({ one, many }) => ({
  loyaltyProgram: one(loyaltyPrograms, {
    fields: [businesses.id],
    references: [loyaltyPrograms.businessId],
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
    fields: [customerLoyalty.customerId],
    references: [customers.id],
  }),
  business: one(businesses, {
    fields: [customerLoyalty.businessId],
    references: [businesses.id],
  }),
}));

export const loyaltyProgramRelations = relations(loyaltyPrograms, ({ one }) => ({
  business: one(businesses, {
    fields: [loyaltyPrograms.businessId],
    references: [businesses.id],
  }),
}));

export const missionRelations = relations(missions, ({ one }) => ({
  business: one(businesses, {
    fields: [missions.businessId],
    references: [businesses.id],
  }),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  business: one(businesses, {
    fields: [transactions.businessId],
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
    fields: [pushSubscriptions.customerId],
    references: [customers.id],
  }),
  business: one(businesses, {
    fields: [pushSubscriptions.businessId],
    references: [businesses.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  customer: one(customers, {
    fields: [notifications.customerId],
    references: [customers.id],
  }),
  business: one(businesses, {
    fields: [notifications.businessId],
    references: [businesses.id],
  }),
}));

export const missionRegistryRelations = relations(missionRegistry, ({ one }) => ({
  customer: one(customers, {
    fields: [missionRegistry.customerId],
    references: [customers.id],
  }),
  mission: one(missions, {
    fields: [missionRegistry.missionId],
    references: [missions.id],
  }),
  business: one(businesses, {
    fields: [missionRegistry.businessId],
    references: [businesses.id],
  }),
}));

export const schema = {
  businesses,
  customers,
  loyaltyPrograms,
  missions,
  transactions,
  rewardRedemptions,
  sessions,
  pushSubscriptions,
  notifications,
  missionRegistry,
};

