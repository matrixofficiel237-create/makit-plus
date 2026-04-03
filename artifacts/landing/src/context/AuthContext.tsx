import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "../lib/api";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("makit_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem("makit_user", JSON.stringify(u));
    else localStorage.removeItem("makit_user");
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
