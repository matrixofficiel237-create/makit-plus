export const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur serveur");
  return data as T;
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  role: string;
  prixSpecial?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OrderItem {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  adresse: { nom: string; telephone: string; quartier: string; details?: string };
  paiement: "livraison" | "orange_money" | "momo";
  statut: "en_attente" | "confirme" | "en_cours" | "livre" | "annule";
  totalProduits: number;
  fraisLivraison: number;
  totalFinal: number;
  date: string;
}

export async function login(telephone: string, motDePasse: string): Promise<User> {
  const data = await request<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ telephone, motDePasse }),
  });
  return data.user;
}

export async function register(payload: {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  motDePasse: string;
  codeParrain?: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<User> {
  const data = await request<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.user;
}

export interface Marche {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  createdBy?: string | null;
  createdAt: string;
}

export async function getMarches(): Promise<Marche[]> {
  const data = await request<{ marches: Marche[] }>("/marches");
  return data.marches;
}

export async function createMarche(payload: { nom: string; latitude: number; longitude: number; createdBy?: string }): Promise<Marche> {
  const data = await request<{ marche: Marche }>("/marches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.marche;
}

export async function deleteMarche(id: string): Promise<void> {
  await request(`/marches/${id}`, { method: "DELETE" });
}

export async function getOrders(userId: string): Promise<Order[]> {
  const data = await request<{ orders: Order[] }>(`/orders?userId=${userId}`);
  return data.orders;
}

export async function createOrder(payload: {
  userId: string;
  items: OrderItem[];
  adresse: { nom: string; telephone: string; quartier: string; details?: string };
  paiement: "livraison" | "orange_money" | "momo";
  totalProduits: number;
  fraisLivraison: number;
  totalFinal: number;
}): Promise<Order> {
  const data = await request<{ order: Order }>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.order;
}
