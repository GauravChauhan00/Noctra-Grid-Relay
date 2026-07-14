import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("noctragrid_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/api/auth/me");
        setUser(data);
      } catch {
        localStorage.removeItem("noctragrid_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);
  async function login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("noctragrid_token", data.access_token);
    setUser(data.user);
    return data.user;
  }
  async function adminLogin(email, password) {
    const { data } = await api.post("/api/auth/admin/login", {
      email,
      password,
    });
    localStorage.setItem("noctragrid_token", data.access_token);
    setUser(data.user);
    return data.user;
  }
  async function signup(name, email, password) {
    const { data } = await api.post("/api/auth/signup", {
      name,
      email,
      password,
    });
    localStorage.setItem("noctragrid_token", data.access_token);
    setUser(data.user);
    return data.user;
  }
  function logout() {
    localStorage.removeItem("noctragrid_token");
    setUser(null);
  }
  const value = useMemo(
    () => ({ user, loading, login, adminLogin, signup, logout, setUser }),
    [user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
