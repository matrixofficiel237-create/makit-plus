import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/utils/api";

export interface User {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  role: "client" | "livreur" | "admin" | "sous_admin";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (telephone: string, motDePasse: string) => Promise<User | null>;
  register: (data: RegisterData) => Promise<User | null>;
  logout: () => Promise<void>;
  resetPassword: (telephone: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  updateCredentials: (currentPassword: string, patch: { newTelephone?: string; newPassword?: string }) => Promise<{ ok: boolean; error?: string }>;
  createManagedUser: (data: ManagedUserData) => Promise<User | null>;
  getManagedUsers: (role?: string) => Promise<User[]>;
  deleteManagedUser: (id: string) => Promise<void>;
}

interface RegisterData {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  motDePasse: string;
}

export interface ManagedUserData {
  nom: string;
  prenom: string;
  telephone: string;
  motDePasse: string;
  role: "livreur" | "sous_admin";
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  async function loadUser() {
    try {
      const userData = await AsyncStorage.getItem("makit_user");
      if (userData) setUser(JSON.parse(userData));
    } catch {}
    finally { setIsLoading(false); }
  }

  async function login(telephone: string, motDePasse: string): Promise<User | null> {
    try {
      const { user: u } = await api.auth.login(telephone, motDePasse);
      await AsyncStorage.setItem("makit_user", JSON.stringify(u));
      setUser(u);
      return u;
    } catch { return null; }
  }

  async function register(data: RegisterData): Promise<User | null> {
    try {
      const { user: u } = await api.auth.register(data);
      await AsyncStorage.setItem("makit_user", JSON.stringify(u));
      setUser(u);
      return u;
    } catch { return null; }
  }

  async function logout(): Promise<void> {
    await AsyncStorage.removeItem("makit_user");
    setUser(null);
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, resetPassword, updateCredentials, createManagedUser, getManagedUsers, deleteManagedUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
