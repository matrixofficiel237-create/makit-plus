import { db, usersTable, ordersTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";

export type StoredUser = typeof usersTable.$inferSelect;
export type StoredOrder = typeof ordersTable.$inferSelect;

const DEFAULT_USERS: (typeof usersTable.$inferInsert)[] = [
  {
    id: "livreur-1",
    nom: "Makit+",
    prenom: "Livreur",
    telephone: "0000000000",
    adresse: "Makit+ HQ",
    motDePasse: "livreur123",
    role: "livreur",
  },
  {
    id: "admin-1",
    nom: "Makit+",
    prenom: "Admin",
    telephone: "admin",
    adresse: "Makit+ HQ",
    motDePasse: "admin123",
    role: "admin",
  },
];

export async function seedDefaultUsers() {
  for (const user of DEFAULT_USERS) {
    await db
      .insert(usersTable)
      .values(user)
      .onConflictDoNothing();
  }
}

// ── Users ──
export async function getAllUsers(): Promise<StoredUser[]> {
  return db.select().from(usersTable);
}

export async function findUserByPhone(telephone: string): Promise<StoredUser | undefined> {
  const rows = await db.select().from(usersTable).where(eq(usersTable.telephone, telephone)).limit(1);
  return rows[0];
}

export async function findUserById(id: string): Promise<StoredUser | undefined> {
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return rows[0];
}

export async function createUser(user: typeof usersTable.$inferInsert): Promise<StoredUser> {
  const rows = await db.insert(usersTable).values(user).returning();
  return rows[0];
}

export async function deleteUser(id: string): Promise<boolean> {
  const rows = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  return rows.length > 0;
}

export async function updateUser(
  id: string,
  patch: Partial<Omit<typeof usersTable.$inferInsert, "id" | "role">>
): Promise<StoredUser | null> {
  const rows = await db.update(usersTable).set(patch).where(eq(usersTable.id, id)).returning();
  return rows[0] ?? null;
}

export async function savePushToken(userId: string, token: string): Promise<boolean> {
  const rows = await db
    .update(usersTable)
    .set({ pushToken: token })
    .where(eq(usersTable.id, userId))
    .returning();
  return rows.length > 0;
}

export async function getUserPushToken(userId: string): Promise<string | null> {
  const rows = await db.select({ pushToken: usersTable.pushToken }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return rows[0]?.pushToken ?? null;
}

export async function getAllUsersByRole(role: string): Promise<StoredUser[]> {
  return db.select().from(usersTable).where(eq(usersTable.role, role));
}

// ── Orders ──
export async function getAllOrders(): Promise<StoredOrder[]> {
  return db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
}

export async function getOrdersByUser(userId: string): Promise<StoredOrder[]> {
  return db.select().from(ordersTable).where(eq(ordersTable.userId, userId)).orderBy(desc(ordersTable.createdAt));
}

export async function createOrder(order: typeof ordersTable.$inferInsert): Promise<StoredOrder> {
  const rows = await db.insert(ordersTable).values(order).returning();
  return rows[0];
}

export async function updateOrder(id: string, patch: Partial<typeof ordersTable.$inferInsert>): Promise<StoredOrder | null> {
  const rows = await db.update(ordersTable).set(patch).where(eq(ordersTable.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const rows = await db.delete(ordersTable).where(eq(ordersTable.id, id)).returning();
  return rows.length > 0;
}
