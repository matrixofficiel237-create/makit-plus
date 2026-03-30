import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  forgotPassword: (telephone: string) => Promise<boolean>;
  createSubAdmin: (data: SubAdminData) => Promise<User | null>;
  getSubAdmins: () => Promise<User[]>;
  deleteSubAdmin: (id: string) => Promise<void>;
}

interface RegisterData {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  motDePasse: string;
}

export interface SubAdminData {
  nom: string;
  prenom: string;
  telephone: string;
  motDePasse: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const userData = await AsyncStorage.getItem("makit_user");
      if (userData) setUser(JSON.parse(userData));
    } catch {}
    finally { setIsLoading(false); }
  }

  async function login(telephone: string, motDePasse: string): Promise<User | null> {
    try {
      if (telephone === "0000000000" && motDePasse === "livreur123") {
        const u: User = { id: "livreur-1", nom: "Livreur", prenom: "Makit+", telephone: "0000000000", adresse: "Makit+ HQ", role: "livreur" };
        await AsyncStorage.setItem("makit_user", JSON.stringify(u));
        setUser(u); return u;
      }
      if (telephone === "admin" && motDePasse === "admin123") {
        const u: User = { id: "admin-1", nom: "Admin", prenom: "Makit+", telephone: "admin", adresse: "Makit+ HQ", role: "admin" };
        await AsyncStorage.setItem("makit_user", JSON.stringify(u));
        setUser(u); return u;
      }
      const usersData = await AsyncStorage.getItem("makit_users");
      const users: (User & { motDePasse: string })[] = usersData ? JSON.parse(usersData) : [];
      const found = users.find((u) => u.telephone === telephone && u.motDePasse === motDePasse);
      if (found) {
        const { motDePasse: _, ...clean } = found;
        await AsyncStorage.setItem("makit_user", JSON.stringify(clean));
        setUser(clean); return clean;
      }
      return null;
    } catch { return null; }
  }

  async function register(data: RegisterData): Promise<User | null> {
    try {
      const usersData = await AsyncStorage.getItem("makit_users");
      const users: (User & { motDePasse: string })[] = usersData ? JSON.parse(usersData) : [];
      if (users.find((u) => u.telephone === data.telephone)) return null;
      const newUser: User & { motDePasse: string } = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        nom: data.nom, prenom: data.prenom, telephone: data.telephone,
        adresse: data.adresse, motDePasse: data.motDePasse, role: "client",
      };
      users.push(newUser);
      await AsyncStorage.setItem("makit_users", JSON.stringify(users));
      const { motDePasse: _, ...clean } = newUser;
      await AsyncStorage.setItem("makit_user", JSON.stringify(clean));
      setUser(clean); return clean;
    } catch { return null; }
  }

  async function logout(): Promise<void> {
    await AsyncStorage.removeItem("makit_user");
    setUser(null);
  }

  async function forgotPassword(telephone: string): Promise<boolean> {
    const usersData = await AsyncStorage.getItem("makit_users");
    const users: (User & { motDePasse: string })[] = usersData ? JSON.parse(usersData) : [];
    return !!users.find((u) => u.telephone === telephone);
  }

  async function createSubAdmin(data: SubAdminData): Promise<User | null> {
    try {
      const usersData = await AsyncStorage.getItem("makit_users");
      const users: (User & { motDePasse: string })[] = usersData ? JSON.parse(usersData) : [];
      if (users.find((u) => u.telephone === data.telephone)) return null;
      const newUser: User & { motDePasse: string } = {
        id: "subadmin-" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
        nom: data.nom, prenom: data.prenom, telephone: data.telephone,
        adresse: "Makit+ HQ", motDePasse: data.motDePasse, role: "sous_admin",
      };
      users.push(newUser);
      await AsyncStorage.setItem("makit_users", JSON.stringify(users));
      const { motDePasse: _, ...clean } = newUser;
      return clean;
    } catch { return null; }
  }

  async function getSubAdmins(): Promise<User[]> {
    const usersData = await AsyncStorage.getItem("makit_users");
    const users: (User & { motDePasse?: string })[] = usersData ? JSON.parse(usersData) : [];
    return users
      .filter((u) => u.role === "sous_admin")
      .map(({ motDePasse: _, ...clean }) => clean);
  }

  async function deleteSubAdmin(id: string): Promise<void> {
    const usersData = await AsyncStorage.getItem("makit_users");
    const users: (User & { motDePasse: string })[] = usersData ? JSON.parse(usersData) : [];
    const filtered = users.filter((u) => u.id !== id);
    await AsyncStorage.setItem("makit_users", JSON.stringify(filtered));
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, forgotPassword, createSubAdmin, getSubAdmins, deleteSubAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
