import { createContext, useContext, useEffect, useState } from "react";

import api from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("learnsphere_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("learnsphere_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        localStorage.setItem("learnsphere_user", JSON.stringify(data.user));
      } catch (_error) {
        localStorage.removeItem("learnsphere_token");
        localStorage.removeItem("learnsphere_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const saveAuth = (payload) => {
    localStorage.setItem("learnsphere_token", payload.token);
    localStorage.setItem("learnsphere_user", JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    saveAuth(data);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    saveAuth(data);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("learnsphere_token");
    localStorage.removeItem("learnsphere_user");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
