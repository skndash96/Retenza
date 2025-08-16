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
  contact_number_2: varchar("contact_number_2", { length: 20 }),
  is_setup_complete: boolean("is_setup_complete").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),

  phone_number: varchar("phone_number", { length: 20 }).unique().notNull(),
  hashed_password: text("hashed_password").notNull(),

  name: text("name"),
  gender: varchar("gender", { length: 10 }),
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
        reward_type: string;
        description: string;
        value: number;
    }[];
};

export const loyaltyPrograms = pgTable("loyalty_programs", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").notNull().unique(),
  points_rate: integer("points_rate").default(1).notNull(),
  description: text("description"),
  tiers: jsonb("tiers").$type<Tier[]>().notNull().default([]),
});

// ====================================================================================
// C. Customer Loyalty Status
// ====================================================================================

export const customerLoyalty = pgTable("customer_loyalty", {
  customer_id: integer("customer_id").notNull(),
  business_id: integer("business_id").notNull(),
  points: integer("points").default(0).notNull(),
  current_tier_name: varchar("current_tier_name", { length: 50 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.customer_id, t.business_id] }),
]);

// ====================================================================================
// D. Missions & Campaigns
// ====================================================================================

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  applicable_tiers: jsonb("applicable_tiers").$type<string[]>().notNull().default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at").notNull(),
});

// ====================================================================================
// E. Transactions
// ====================================================================================

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull(),
  business_id: integer("business_id").notNull(),
  bill_amount: integer("bill_amount").notNull(),
  points_awarded: integer("points_awarded").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
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
// G. Drizzle Relations 
// ====================================================================================

export const businessRelations = relations(businesses, ({ one, many }) => ({
  loyaltyProgram: one(loyaltyPrograms, {
    fields: [businesses.id],
    references: [loyaltyPrograms.business_id],
  }),
  customerLoyalty: many(customerLoyalty),
  campaigns: many(campaigns),
  transactions: many(transactions),
  sessions: many(sessions),
}));

export const customerRelations = relations(customers, ({ many }) => ({
  customerLoyalty: many(customerLoyalty),
  transactions: many(transactions),
  sessions: many(sessions),
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

export const campaignRelations = relations(campaigns, ({ one }) => ({
  business: one(businesses, {
    fields: [campaigns.business_id],
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
export const schema = {
  businesses,
  customers,
  loyaltyPrograms,
  customerLoyalty,
  campaigns,
  transactions,
  sessions,
};

