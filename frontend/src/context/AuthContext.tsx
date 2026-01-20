"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Role = "consumer" | "distributor" | "manufacturer" | "admin" | null;

interface AuthContextType {
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const stored = localStorage.getItem("role") as Role;
    if (stored) setRole(stored);
  }, []);

  function login(newRole: Role) {
    setRole(newRole);
    if (newRole) localStorage.setItem("role", newRole);
  }

  function logout() {
    setRole(null);
    localStorage.removeItem("role");
  }

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
