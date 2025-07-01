import { useState, useEffect } from "react";

interface User {
  id: number;
  fullName: string;
  email: string;
  userId: string;
  isAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for existing token in localStorage
    const token = localStorage.getItem("asser_token");
    const userData = localStorage.getItem("asser_user");

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("asser_token");
        localStorage.removeItem("asser_user");
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("asser_token", token);
    localStorage.setItem("asser_user", JSON.stringify(user));
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("asser_token");
    localStorage.removeItem("asser_user");
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshUser = async () => {
    try {
      const token = authState.token || localStorage.getItem("asser_token");
      if (!token) return;

      const response = await fetch("/api/auth/refresh", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.user;
        localStorage.setItem("asser_user", JSON.stringify(updatedUser));
        setAuthState(prev => ({
            ...prev,
            user: updatedUser,
        }));
        console.log("User data refreshed successfully:", updatedUser);
      } else {
        console.error("Failed to refresh user data:", response.status);
      }
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  const getAuthHeaders = () => {
    const token = authState.token || localStorage.getItem("asser_token");
    const headers: HeadersInit = {};
    if (token) {
      (headers as any).Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchUser = async (): Promise<User | null> => {
    try {
      const response = await fetch("/api/user/profile", {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return null;
        }
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();

      // Refresh admin status
      const adminResponse = await fetch("/api/user/admin-status", {
        headers: getAuthHeaders()
      });

      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        data.user.isAdmin = adminData.isAdmin;
      }

      return data.user;
    } catch (error) {
      console.error("Error fetching user:", error);
      logout();
      return null;
    }
  };

  return {
    ...authState,
    login,
    logout,
    refreshUser,
    getAuthHeaders,
  };
}