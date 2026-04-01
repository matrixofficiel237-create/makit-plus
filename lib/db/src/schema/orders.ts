import { pgTable, text, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  items: jsonb("items").notNull().default([]),
  adresse: jsonb("adresse").notNull(),
  paiement: text("paiement").notNull().default("livraison"),
  statut: text("statut").notNull().default("en_attente"),
  totalProduits: real("total_produits").notNull().default(0),
  fraisLivraison: real("frais_livraison").notNull().default(0),
  totalFinal: real("total_final").notNull().default(0),
  date: text("date").notNull(),
  livreurId: text("livreur_id"),
  confirmeRecu: boolean("confirme_recu").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StoredOrder = typeof ordersTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;
