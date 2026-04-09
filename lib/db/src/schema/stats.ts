import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const statsTable = pgTable("stats", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
});

export type StoredStat = typeof statsTable.$inferSelect;
