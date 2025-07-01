import { pgTable, text, serial, integer, timestamp, decimal, boolean, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"), // Optional now
  password: text("password").notNull(),
  userId: text("user_id").notNull().unique(), // 5-digit ID
  referralCode: text("referral_code"), // Used referral code
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  isAdmin: boolean("is_admin").default(false),
  country: text("country"),
  ipAddress: text("ip_address"),
  phoneVerified: boolean("phone_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User balances
export const balances = pgTable("balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  usdt: decimal("usdt", { precision: 15, scale: 2 }).default("0"),
  egp: decimal("egp", { precision: 15, scale: 2 }).default("0"),
  asserCoin: decimal("asser_coin", { precision: 15, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exchange rates
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  usdtToAsser: decimal("usdt_to_asser", { precision: 10, scale: 2 }).default("10"),
  egpToAsser: decimal("egp_to_asser", { precision: 10, scale: 2 }).default("0.2"),
  asserToUsdt: decimal("asser_to_usdt", { precision: 10, scale: 6 }).default("0.10"),
  asserToEgp: decimal("asser_to_egp", { precision: 10, scale: 4 }).default("5"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'exchange', 'game_win', 'game_loss', 'game_investment', 'referral', 'purchase', 'transfer', 'farm_harvest'
  fromCurrency: text("from_currency"),
  toCurrency: text("to_currency"),
  fromAmount: decimal("from_amount", { precision: 15, scale: 2 }),
  toAmount: decimal("to_amount", { precision: 15, scale: 2 }),
  description: text("description"),
  status: text("status").default("completed"), // 'pending', 'completed', 'failed'
  recipientUserId: integer("recipient_user_id").references(() => users.id), // For transfers
  transferFee: decimal("transfer_fee", { precision: 15, scale: 2 }).default("0"), // Transfer fee amount
  createdAt: timestamp("created_at").defaultNow(),
});

// Farm game state
export const farmStates = pgTable("farm_states", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  currentEarnings: decimal("current_earnings", { precision: 15, scale: 2 }).default("0"),
  totalEarnings: decimal("total_earnings", { precision: 15, scale: 2 }).default("0"),
  dailyProduction: decimal("daily_production", { precision: 15, scale: 2 }).default("0"),
  plantedItems: jsonb("planted_items").default([]), // Array of planted cacti
  isGrowing: boolean("is_growing").default(false),
  plantedAt: timestamp("planted_at"),
  lastHarvest: timestamp("last_harvest"),
  lastWatering: timestamp("last_watering"),
  nextWateringAvailable: timestamp("next_watering_available"),
  nextHarvestTime: timestamp("next_harvest_time"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});





// Referrals
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id).notNull(),
  referredId: integer("referred_id").references(() => users.id).notNull(),
  earnings: decimal("earnings", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Verification codes
export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  phone: text("phone"), // Optional now
  emailCode: text("email_code").notNull(),
  phoneCode: text("phone_code"), // Optional now
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Temporary user data before verification
export const tempUsers = pgTable("temp_users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"), // Optional now
  password: text("password").notNull(),
  userId: text("user_id").notNull(),
  referralCode: text("referral_code"),
  country: text("country"),
  ipAddress: text("ip_address"),
  verificationId: integer("verification_id").references(() => verificationCodes.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  balance: one(balances, {
    fields: [users.id],
    references: [balances.userId],
  }),
  farmState: one(farmStates, {
    fields: [users.id],
    references: [farmStates.userId],
  }),
  transactions: many(transactions),
  referralsGiven: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referred" }),
}));

export const balancesRelations = relations(balances, ({ one }) => ({
  user: one(users, {
    fields: [balances.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const farmStatesRelations = relations(farmStates, ({ one }) => ({
  user: one(users, {
    fields: [farmStates.userId],
    references: [users.id],
  }),
}));



export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
    relationName: "referred",
  }),
}));

// Smart Strategy Game
export const smartStrategyGames = pgTable("smart_strategy_games", {
  id: serial("id").primaryKey(),
  strategy: text("strategy").notNull(), // The calculation strategy
  correctAnswer: integer("correct_answer").notNull(), // 1-10 door number
  isActive: boolean("is_active").default(true),
  duration: integer("duration").default(100), // seconds
  startTime: timestamp("start_time").defaultNow(), // Global start time for synchronized countdown
  endTime: timestamp("end_time"), // Calculated end time
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
});

// Game Participations
export const gameParticipations = pgTable("game_participations", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => smartStrategyGames.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  investedAmount: decimal("invested_amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull(), // 'usdt', 'egp', 'asser'
  selectedDoor: integer("selected_door"), // 1-10
  isCorrect: boolean("is_correct"),
  reward: decimal("reward", { precision: 15, scale: 2 }).default("0"),
  participatedAt: timestamp("participated_at").defaultNow(),
});

// Payment Requests (Deposits/Withdrawals)
export const paymentRequests = pgTable("payment_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'deposit' or 'withdrawal'
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull(), // 'egp' or 'usdt'
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  walletAddress: text("wallet_address"), // For USDT withdrawals
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
});

// Payment accounts approval system
export const paymentAccountApprovals = pgTable("payment_account_approvals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  paymentType: text("payment_type").notNull(), // "deposit" or "withdrawal"
  currency: text("currency").notNull(), // "egp" or "usdt"
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Phone Verification Requests
export const phoneVerificationRequests = pgTable("phone_verification_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  phoneNumber: text("phone_number").notNull(),
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
});

// Telegram Game Subscriptions
export const telegramGameSubscriptions = pgTable("telegram_game_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gameTime: text("game_time").notNull(), // "15:00", "18:00", "21:00"
  isActive: boolean("is_active").default(true),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
});

// Game Relations
export const smartStrategyGamesRelations = relations(smartStrategyGames, ({ one, many }) => ({
  creator: one(users, {
    fields: [smartStrategyGames.createdBy],
    references: [users.id],
  }),
  participations: many(gameParticipations),
}));

export const gameParticipationsRelations = relations(gameParticipations, ({ one }) => ({
  game: one(smartStrategyGames, {
    fields: [gameParticipations.gameId],
    references: [smartStrategyGames.id],
  }),
  user: one(users, {
    fields: [gameParticipations.userId],
    references: [users.id],
  }),
}));

export const paymentRequestsRelations = relations(paymentRequests, ({ one }) => ({
  user: one(users, {
    fields: [paymentRequests.userId],
    references: [users.id],
  }),
  processor: one(users, {
    fields: [paymentRequests.processedBy],
    references: [users.id],
  }),
}));

export const phoneVerificationRequestsRelations = relations(phoneVerificationRequests, ({ one }) => ({
  user: one(users, {
    fields: [phoneVerificationRequests.userId],
    references: [users.id],
  }),
  processor: one(users, {
    fields: [phoneVerificationRequests.processedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  userId: z.string().optional(),
  fullName: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().optional().nullable()
});
export const insertBalanceSchema = createInsertSchema(balances).omit({ id: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({ id: true, createdAt: true });

// Insert schemas
export const insertSmartStrategyGameSchema = createInsertSchema(smartStrategyGames).omit({ 
  id: true, 
  createdAt: true 
});

export const insertGameParticipationSchema = createInsertSchema(gameParticipations).omit({ 
  id: true, 
  participatedAt: true 
});

export const insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({ 
  id: true, 
  createdAt: true,
  processedAt: true,
  processedBy: true 
});

export const insertPaymentAccountApprovalSchema = createInsertSchema(paymentAccountApprovals).omit({ 
  id: true, 
  createdAt: true,
  approvedAt: true,
  approvedBy: true 
});

export const insertPhoneVerificationSchema = createInsertSchema(phoneVerificationRequests).omit({ 
  id: true, 
  createdAt: true,
  processedAt: true,
  processedBy: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Balance = typeof balances.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type FarmState = typeof farmStates.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type TempUser = typeof tempUsers.$inferSelect;
export type SmartStrategyGame = typeof smartStrategyGames.$inferSelect;
export type GameParticipation = typeof gameParticipations.$inferSelect;
export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type PhoneVerificationRequest = typeof phoneVerificationRequests.$inferSelect;
export type TelegramGameSubscription = typeof telegramGameSubscriptions.$inferSelect;
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;
export type PaymentAccountApproval = typeof paymentAccountApprovals.$inferSelect;
export type InsertPaymentAccountApproval = z.infer<typeof insertPaymentAccountApprovalSchema>;