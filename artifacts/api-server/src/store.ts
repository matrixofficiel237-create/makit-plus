import { db, usersTable, ordersTable, statsTable, referralHistoryTable, notificationsTable, marchesTable } from "@workspace/db";
import { eq, desc, inArray, sql } from "drizzle-orm";

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

export async function incrementVisitors(): Promise<number> {
  await db
    .insert(statsTable)
    .values({ key: "visitors", value: 1 })
    .onConflictDoUpdate({
      target: statsTable.key,
      set: { value: sql`${statsTable.value} + 1` },
    });
  const row = await db.select().from(statsTable).where(eq(statsTable.key, "visitors"));
  return row[0]?.value ?? 1;
}

export async function getVisitors(): Promise<number> {
  const row = await db.select().from(statsTable).where(eq(statsTable.key, "visitors"));
  return row[0]?.value ?? 0;
}

// ── Referral / Promo ──

export function generatePromoCode(prenom: string): string {
  const base = prenom.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6).padEnd(3, "X");
  const suffix = Math.floor(Math.random() * 900 + 100).toString();
  return base + suffix;
}

export async function findUserByPromoCode(code: string): Promise<StoredUser | undefined> {
  const rows = await db.select().from(usersTable).where(eq(usersTable.promoCode, code.toUpperCase())).limit(1);
  return rows[0];
}

export async function setPromoCode(userId: string, code: string): Promise<StoredUser | null> {
  const rows = await db.update(usersTable).set({ promoCode: code.toUpperCase() }).where(eq(usersTable.id, userId)).returning();
  return rows[0] ?? null;
}

export async function addPointsToUser(userId: string, delta: number): Promise<number> {
  const rows = await db.update(usersTable)
    .set({ points: sql`${usersTable.points} + ${delta}` })
    .where(eq(usersTable.id, userId))
    .returning({ points: usersTable.points });
  return rows[0]?.points ?? 0;
}

export async function createReferralEvent(data: {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
}): Promise<void> {
  await db.insert(referralHistoryTable).values({ ...data, points: 1 });
}

export async function getReferralHistory(referrerId: string) {
  return db.select().from(referralHistoryTable).where(eq(referralHistoryTable.referrerId, referrerId)).orderBy(desc(referralHistoryTable.createdAt));
}

export async function getAllReferrals() {
  return db.select().from(referralHistoryTable).orderBy(desc(referralHistoryTable.createdAt));
}

export async function hasPrixSpecial(user: { nom: string; prenom: string; referredBy?: string | null }): Promise<boolean> {
  const ownName = `${user.nom} ${user.prenom}`.toUpperCase();
  if (ownName.includes("PROMHANDICAM")) return true;
  if (!user.referredBy) return false;
  const parrain = await findUserByPromoCode(user.referredBy);
  if (!parrain) return false;
  const parrainName = `${parrain.nom} ${parrain.prenom}`.toUpperCase();
  return parrainName.includes("PROMHANDICAM");
}

export async function useReward(userId: string): Promise<{ ok: boolean; availableRewards: number }> {
  const user = await findUserById(userId);
  if (!user) return { ok: false, availableRewards: 0 };
  const available = Math.floor(user.points / 10) - user.rewardsUsed;
  if (available <= 0) return { ok: false, availableRewards: 0 };
  await db.update(usersTable).set({ rewardsUsed: sql`${usersTable.rewardsUsed} + 1` }).where(eq(usersTable.id, userId));
  return { ok: true, availableRewards: available - 1 };
}

// ── Notifications ──

export async function createNotification(data: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
  await db.insert(notificationsTable).values({
    id,
    userId: data.userId,
    title: data.title,
    body: data.body,
    data: data.data ?? {},
  });
}

export async function getNotificationsByUser(userId: string) {
  return db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
}

export async function markNotificationRead(id: string): Promise<void> {
  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id));
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.userId, userId));
}

export async function deleteNotification(id: string): Promise<void> {
  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
}

// ── Marchés ──
export async function getAllMarches() {
  return db.select().from(marchesTable).orderBy(marchesTable.createdAt);
}

export async function createMarche(data: { nom: string; latitude: number; longitude: number; createdBy?: string }) {
  const id = `marche-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const rows = await db.insert(marchesTable).values({ id, ...data }).returning();
  return rows[0];
}

export async function deleteMarche(id: string): Promise<void> {
  await db.delete(marchesTable).where(eq(marchesTable.id, id));
}
