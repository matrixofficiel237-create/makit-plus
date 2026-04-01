import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  prenom: text("prenom").notNull(),
  telephone: text("telephone").notNull().unique(),
  adresse: text("adresse").notNull(),
  motDePasse: text("mot_de_passe").notNull(),
  role: text("role").notNull().default("client"),
  pushToken: text("push_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StoredUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
