import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const referralHistoryTable = pgTable("referral_history", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id").notNull(),
  referredUserId: text("referred_user_id").notNull(),
  referredUserName: text("referred_user_name").notNull(),
  points: integer("points").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StoredReferral = typeof referralHistoryTable.$inferSelect;
