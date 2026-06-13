export const API_BASE = "https://market-fresh-delivery--makit4079.replit.app/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Impossible de se connecter au serveur. Vérifiez votre connexion internet.");
  }

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Le serveur est temporairement indisponible. Réessayez dans quelques secondes.");
  }

  if (!res.ok) throw new Error(data.error || "Erreur serveur");
  return data as T;
}

export const api = {
  auth: {
    login: (telephone: string, motDePasse: string) =>
      apiFetch<{ user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ telephone, motDePasse }),
      }),
    register: (body: { nom: string; prenom: string; telephone: string; adresse: string; motDePasse: string; codeParrain?: string; latitude?: number | null; longitude?: number | null }) =>
      apiFetch<{ user: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    resetPassword: (telephone: string, newPassword: string) =>
      apiFetch<{ success: boolean }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ telephone, newPassword }),
      }),
    updateCredentials: (userId: string, currentPassword: string, patch: { newTelephone?: string; newPassword?: string }) =>
      apiFetch<{ user: any }>("/auth/update-credentials", {
        method: "PATCH",
        body: JSON.stringify({ userId, currentPassword, ...patch }),
      }),
    me: (id: string) => apiFetch<{ user: any }>(`/auth/me/${id}`),
  },
  orders: {
    getAll: () => apiFetch<{ orders: any[] }>("/orders"),
    getByUser: (userId: string) => apiFetch<{ orders: any[] }>(`/orders?userId=${userId}`),
    create: (order: any) =>
      apiFetch<{ order: any }>("/orders", { method: "POST", body: JSON.stringify(order) }),
    update: (id: string, patch: any) =>
      apiFetch<{ order: any }>(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/orders/${id}`, { method: "DELETE" }),
  },
  users: {
    getAll: (role?: string) =>
      apiFetch<{ users: any[] }>(`/users${role ? `?role=${role}` : ""}`),
    create: (body: { nom: string; prenom: string; telephone: string; motDePasse: string; role: string; adresse?: string }) =>
      apiFetch<{ user: any }>("/users", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, patch: { nom?: string; prenom?: string; telephone?: string; adresse?: string }) =>
      apiFetch<{ user: any }>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: string) => apiFetch<{ success: boolean }>(`/users/${id}`, { method: "DELETE" }),
    savePushToken: (userId: string, token: string) =>
      apiFetch<{ success: boolean }>(`/users/${userId}/push-token`, {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
  },
  referral: {
    get: (userId: string) =>
      apiFetch<{ promoCode: string | null; points: number; rewardsUsed: number; availableRewards: number; history: any[] }>(`/referral/${userId}`),
    generate: (userId: string) =>
      apiFetch<{ promoCode: string }>(`/referral/${userId}/generate`, { method: "POST" }),
    useReward: (userId: string) =>
      apiFetch<{ ok: boolean; availableRewards: number }>(`/referral/${userId}/use-reward`, { method: "POST" }),
    adminAll: () =>
      apiFetch<{ totalReferrals: number; totalPoints: number; totalRewardsUsed: number; usersWithPromo: number; topReferrers: any[]; recentReferrals: any[] }>("/referral/admin/all"),
  },
  notifications: {
    getByUser: (userId: string) =>
      apiFetch<{ notifications: any[] }>(`/notifications?userId=${userId}`),
    markRead: (id: string) =>
      apiFetch<{ success: boolean }>(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: (userId: string) =>
      apiFetch<{ success: boolean }>(`/notifications/read-all`, {
        method: "PATCH",
        body: JSON.stringify({ userId }),
      }),
    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/notifications/${id}`, { method: "DELETE" }),
  },
};
