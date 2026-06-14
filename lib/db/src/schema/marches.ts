import { pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const marchesTable = pgTable("marches", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StoredMarche = typeof marchesTable.$inferSelect;
export type InsertMarche = typeof marchesTable.$inferInsert;
