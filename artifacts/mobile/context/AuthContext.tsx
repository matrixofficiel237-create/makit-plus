import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { api } from "@/utils/api";
import { registerForPushNotifications } from "@/utils/notifications";

export interface User {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  role: "client" | "livreur" | "admin" | "sous_admin";
  promoCode?: string | null;
  points?: number;
  rewardsUsed?: number;
  referredBy?: string | null;
  prixSpecial?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface AuthContextType {
  user: User | null;
  aiToken: string | null;
  isLoading: boolean;
  login: (telephone: string, motDePasse: string) => Promise<User | null>;
  register: (data: RegisterData) => Promise<User | null>;
  logout: () => Promise<void>;
  resetPassword: (telephone: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  updateCredentials: (currentPassword: string, patch: { newTelephone?: string; newPassword?: string }) => Promise<{ ok: boolean; error?: string }>;
  createManagedUser: (data: ManagedUserData) => Promise<User | null>;
  getManagedUsers: (role?: string) => Promise<User[]>;
  deleteManagedUser: (id: string) => Promise<void>;
  /** Exchanges the current (still-valid) token for a fresh one. Returns the new token or null. */
  refreshAiToken: () => Promise<string | null>;
}

interface RegisterData {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  motDePasse: string;
  codeParrain?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ManagedUserData {
  nom: string;
  prenom: string;
  telephone: string;
  motDePasse: string;
  role: "livreur" | "sous_admin";
}

const AuthContext = createContext<AuthContextType | null>(null);

async function captureGPSSilently(userId: string, setUser: React.Dispatch<React.SetStateAction<User | null>>) {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = loc.coords;
    api.users.update(userId, { latitude, longitude }).then(({ user: updated }) => {
      setUser(prev => prev ? { ...prev, latitude: updated.latitude, longitude: updated.longitude } : prev);
      AsyncStorage.getItem("makit_user").then(raw => {
        if (raw) {
          const cached = JSON.parse(raw);
          AsyncStorage.setItem("makit_user", JSON.stringify({ ...cached, latitude, longitude })).catch(() => {});
        }
      }).catch(() => {});
    }).catch(() => {});
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [aiToken, setAiToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  async function loadUser() {
    try {
      const [userData, storedToken] = await Promise.all([
        AsyncStorage.getItem("makit_user"),
        AsyncStorage.getItem("makit_ai_token"),
      ]);
      if (userData) {
        const cached = JSON.parse(userData);
        setUser(cached);
        if (storedToken) setAiToken(storedToken);
        registerForPushNotifications(cached.id).catch(() => {});
        if (cached.role === "client") {
          captureGPSSilently(cached.id, setUser);
        }
        api.auth.me(cached.id).then(async (meRes: Record<string, unknown>) => {
          const fresh = meRes["user"] as typeof cached;
          await AsyncStorage.setItem("makit_user", JSON.stringify(fresh));
          setUser(fresh);
          // Capture fresh aiToken — covers users who logged in before the
          // voice feature was added and never received one.
          const freshToken = meRes["aiToken"] as string | undefined;
          if (freshToken) {
            await AsyncStorage.setItem("makit_ai_token", freshToken);
            setAiToken(freshToken);
          }
        }).catch(() => {});
      }
    } catch {}
    finally { setIsLoading(false); }
  }

  async function login(telephone: string, motDePasse: string): Promise<User | null> {
    const res = await api.auth.login(telephone, motDePasse);
    const u = res.user;
    const token: string | undefined = (res as Record<string, unknown>)["aiToken"] as string | undefined;
    await AsyncStorage.setItem("makit_user", JSON.stringify(u));
    if (token) {
      await AsyncStorage.setItem("makit_ai_token", token);
      setAiToken(token);
    }
    setUser(u);
    registerForPushNotifications(u.id).catch(() => {});
    if (u.role === "client") {
      captureGPSSilently(u.id, setUser);
    }
    return u;
  }

  async function register(data: RegisterData): Promise<User | null> {
    const res = await api.auth.register(data);
    const u = res.user;
    const token: string | undefined = (res as Record<string, unknown>)["aiToken"] as string | undefined;
    await AsyncStorage.setItem("makit_user", JSON.stringify(u));
    if (token) {
      await AsyncStorage.setItem("makit_ai_token", token);
      setAiToken(token);
    }
    setUser(u);
    registerForPushNotifications(u.id).catch(() => {});
    if (u.role === "client") {
      captureGPSSilently(u.id, setUser);
    }
    return u;
  }

  async function logout(): Promise<void> {
    await AsyncStorage.multiRemove(["makit_user", "makit_ai_token"]);
    setUser(null);
    setAiToken(null);
  }

  async function resetPassword(telephone: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await api.auth.resetPassword(telephone, newPassword);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || "Erreur réseau" };
    }
  }

  async function updateCredentials(currentPassword: string, patch: { newTelephone?: string; newPassword?: string }): Promise<{ ok: boolean; error?: string }> {
    if (!user) return { ok: false, error: "Non connecté" };
    try {
      const { user: updated } = await api.auth.updateCredentials(user.id, currentPassword, patch);
      const merged = { ...user, ...updated };
      await AsyncStorage.setItem("makit_user", JSON.stringify(merged));
      setUser(merged);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || "Erreur réseau" };
    }
  }

  async function createManagedUser(data: ManagedUserData): Promise<User | null> {
    try {
      const { user: u } = await api.users.create(data);
      return u;
    } catch { return null; }
  }

  async function getManagedUsers(role?: string): Promise<User[]> {
    try {
      const { users } = await api.users.getAll(role);
      return users;
    } catch { return []; }
  }

  async function deleteManagedUser(id: string): Promise<void> {
    await api.users.delete(id);
  }

  /**
   * Exchanges the current (still-valid) aiToken for a fresh daily token.
   * Calls the authenticated refresh endpoint — only works if the existing
   * token has not already expired. Returns the new token on success, null otherwise.
   */
  async function refreshAiToken(): Promise<string | null> {
    const currentToken = await AsyncStorage.getItem("makit_ai_token");
    const currentUser = user;
    if (!currentToken || !currentUser) return null;
    try {
      const res = await fetch(`${(await import("@/utils/api")).API_BASE}/auth/ai-token/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { aiToken?: string };
      if (!data.aiToken) return null;
      await AsyncStorage.setItem("makit_ai_token", data.aiToken);
      setAiToken(data.aiToken);
      return data.aiToken;
    } catch {
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ user, aiToken, isLoading, login, register, logout, resetPassword, updateCredentials, createManagedUser, getManagedUsers, deleteManagedUser, refreshAiToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
