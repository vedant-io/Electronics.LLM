"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
  role: "student" | "teacher";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    role: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserFromToken: (token: string) => Promise<any>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/agents", "") ||
  "http://localhost:3050/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { "x-auth-token": authToken },
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data.user || data);
      return data.user || data;
    } catch {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    const publicPaths = ["/", "/login", "/register"];
    const isPublic = publicPaths.includes(pathname) || pathname.startsWith("/project/");

    if (!user && !isPublic) {
      router.push("/login");
      return;
    }

    if (user && (pathname === "/login" || pathname === "/register")) {
      router.push(
        user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard",
      );
      return;
    }

    if (user && pathname.startsWith("/student") && user.role !== "student") {
      router.push("/teacher/dashboard");
      return;
    }

    if (user && pathname.startsWith("/teacher") && user.role !== "teacher") {
      router.push("/student/dashboard");
      return;
    }
  }, [user, isLoading, pathname, router]);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || data.errors?.[0]?.msg || "Login failed");
    }
    const data = await res.json();
    const authToken = data.token;
    localStorage.setItem("token", authToken);
    setToken(authToken);
    const userData = await fetchUser(authToken);
    if (userData) {
      router.push(
        userData.role === "teacher"
          ? "/teacher/dashboard"
          : "/student/dashboard",
      );
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: string,
  ) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(
        data.message || data.errors?.[0]?.msg || "Registration failed",
      );
    }
    const data = await res.json();
    const authToken = data.token;
    localStorage.setItem("token", authToken);
    setToken(authToken);
    const userData = await fetchUser(authToken);
    if (userData) {
      router.push(
        userData.role === "teacher"
          ? "/teacher/dashboard"
          : "/student/dashboard",
      );
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { "x-auth-token": token },
        });
      } catch {}
    }
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to change password");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        fetchUserFromToken: fetchUser,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
