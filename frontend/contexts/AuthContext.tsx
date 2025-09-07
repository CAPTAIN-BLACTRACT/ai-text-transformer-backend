import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import backend from "~backend/client";
import type { User } from "~backend/auth/user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await backend.auth.getProfile();
      setUser(response);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await backend.auth.login({ email, password });
    setUser(response.user);
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await backend.auth.signup({ email, password });
      setUser(response.user);
    } catch (err: any) {
      // Handle API errors by checking the error structure
      if (err && typeof err === 'object' && err.message) {
        throw new Error(err.message);
      }
      // Fallback for unexpected errors
      throw new Error("An unexpected error occurred. Please check your connection.");
    }
  };

  const logout = async () => {
    try {
      await backend.auth.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
