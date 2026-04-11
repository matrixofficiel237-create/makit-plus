export const API_BASE = "https://market-fresh-delivery--makit4079.replit.app/api";

async function apiFetch<T>(path: string, options?: RequestInit, _retry = 1): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    if (_retry > 0) {
      await new Promise(r => setTimeout(r, 2500));
      return apiFetch<T>(path, options, 0);
    }
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
    register: (body: { nom: string; prenom: string; telephone: string; adresse: string; motDePasse: string; codeParrain?: string }) =>
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
      apiFetch<any>("/referral/admin/all"),
  },
};
