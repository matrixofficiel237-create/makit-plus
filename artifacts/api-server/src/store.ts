import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "makit_data.json");

export interface StoredUser {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  motDePasse: string;
  role: "client" | "livreur" | "admin" | "sous_admin";
  pushToken?: string;
}

export interface StoredOrder {
  id: string;
  userId: string;
  items: any[];
  adresse: { quartier: string; rue: string; description: string };
  paiement: "livraison" | "mobile_money";
  statut: "en_attente" | "achat_en_cours" | "en_livraison" | "livre";
  totalProduits: number;
  fraisLivraison: number;
  totalFinal: number;
  date: string;
  livreurId?: string;
  confirmeRecu?: boolean;
}

interface Store {
  users: StoredUser[];
  orders: StoredOrder[];
}

let store: Store = {
  users: [
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
  ],
  orders: [],
};

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw) as Store;
      // Merge: keep default users if not in file
      const defaultIds = new Set(store.users.map((u) => u.id));
      const fileIds = new Set(parsed.users.map((u: StoredUser) => u.id));
      for (const u of store.users) {
        if (!fileIds.has(u.id)) parsed.users.push(u);
      }
      store = parsed;
    }
  } catch {}
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch {}
}

loadStore();

// ── Users ──
export function getAllUsers(): StoredUser[] {
  return store.users;
}

export function findUserByPhone(telephone: string): StoredUser | undefined {
  return store.users.find((u) => u.telephone === telephone);
}

export function findUserById(id: string): StoredUser | undefined {
  return store.users.find((u) => u.id === id);
}

export function createUser(user: StoredUser): StoredUser {
  store.users.push(user);
  saveStore();
  return user;
}

export function deleteUser(id: string): boolean {
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  store.users.splice(idx, 1);
  saveStore();
  return true;
}

export function updateUser(id: string, patch: Partial<Omit<StoredUser, "id" | "role">>): StoredUser | null {
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  store.users[idx] = { ...store.users[idx], ...patch };
  saveStore();
  return store.users[idx];
}

export function savePushToken(userId: string, token: string): boolean {
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) return false;
  store.users[idx].pushToken = token;
  saveStore();
  return true;
}

export function getUserPushToken(userId: string): string | null {
  const user = store.users.find((u) => u.id === userId);
  return user?.pushToken || null;
}

export function getAllUsersByRole(role: string): StoredUser[] {
  return store.users.filter((u) => u.role === role);
}

// ── Orders ──
export function getAllOrders(): StoredOrder[] {
  return [...store.orders].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getOrdersByUser(userId: string): StoredOrder[] {
  return store.orders
    .filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function createOrder(order: StoredOrder): StoredOrder {
  store.orders.push(order);
  saveStore();
  return order;
}

export function updateOrder(id: string, patch: Partial<StoredOrder>): StoredOrder | null {
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  store.orders[idx] = { ...store.orders[idx], ...patch };
  saveStore();
  return store.orders[idx];
}
