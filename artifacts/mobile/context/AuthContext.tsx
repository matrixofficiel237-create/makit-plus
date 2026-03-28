import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface User {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  role: "client" | "livreur" | "admin";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (telephone: string, motDePasse: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (telephone: string) => Promise<boolean>;
}

interface RegisterData {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
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
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  async function login(telephone: string, motDePasse: string): Promise<boolean> {
    try {
      const usersData = await AsyncStorage.getItem("makit_users");
      const users: (User & { motDePasse: string })[] = usersData ? JSON.parse(usersData) : [];

      // Check for livreur test account
      if (telephone === "0000000000" && motDePasse === "livreur123") {
        const livreurUser: User = {
          id: "livreur-1",
          nom: "Livreur",
          prenom: "Makit+",
          telephone: "0000000000",
          adresse: "Makit+ HQ",
          role: "livreur",
        };
        await AsyncStorage.setItem("makit_user", JSON.stringify(livreurUser));
        setUser(livreurUser);
        return true;
      }

      const found = users.find(
        (u) => u.telephone === telephone && u.motDePasse === motDePasse
      );
      if (found) {
        const { motDePasse: _pwd, ...userWithoutPwd } = found;
        await AsyncStorage.setItem("makit_user", JSON.stringify(userWithoutPwd));
        setUser(userWithoutPwd);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async function register(data: RegisterData): Promise<boolean> {
    try {
      const usersData = await AsyncStorage.getItem("makit_users");
      const users: (User & { motDePasse: string })[] = usersData ? JSON.parse(usersData) : [];

      const exists = users.find((u) => u.telephone === data.telephone);
      if (exists) return false;

      const newUser: User & { motDePasse: string } = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        adresse: data.adresse,
        motDePasse: data.motDePasse,
        role: "client",
      };

      users.push(newUser);
      await AsyncStorage.setItem("makit_users", JSON.stringify(users));

      const { motDePasse: _pwd, ...userWithoutPwd } = newUser;
      await AsyncStorage.setItem("makit_user", JSON.stringify(userWithoutPwd));
      setUser(userWithoutPwd);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function logout(): Promise<void> {
    await AsyncStorage.removeItem("makit_user");
    setUser(null);
  }

  async function forgotPassword(telephone: string): Promise<boolean> {
    const usersData = await AsyncStorage.getItem("makit_users");
    const users: (User & { motDePasse: string })[] = usersData ? JSON.parse(usersData) : [];
    const found = users.find((u) => u.telephone === telephone);
    return !!found;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
