"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import useSWR from "swr";
import { apiClient, TokenManager } from "@/lib/api-client";

export type Role = "sender" | "agent" | null;

export interface AgentDetails {
  bio?: string;
  specialties?: string[];
  yearsExperience?: number;
  avatarUrl?: string;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  completedProjects?: number;
  companyName?: string;
  portfolioUrl?: string;
  availabilityStatus?: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  name?: string;
  email: string;
  role: Role;
  country: string;
  phoneNumber?: string;
  currencyPreference?: string;
  timezone?: string;
  createdAt?: string;
  avatarUrl?: string;
  agentDetails?: AgentDetails;
}

interface AuthContextType {
  user: AuthUser | null;
  role: Role;
  isLoading: boolean;
  mutateUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // We use SWR to fetch the user profile. If there's no token, we shouldn't fetch.
  const fetcher = async () => {
    if (!TokenManager.getToken()) return null;
    try {
      const data = await apiClient<AuthUser>("/auth/me");
      // Always cache fresh user on a successful fetch
      TokenManager.setCachedUser(data);
      return data;
    } catch (err: any) {
      const status = err?.status || err?.statusCode;
      
      // Real 401: token is invalid/expired — clear everything and force re-login
      if (status === 401) {
        console.warn("Got 401 from /auth/me — clearing session.");
        TokenManager.clearToken();
        return null;
      }

      // Any other error (404, 500, network failure etc.): use the cached user 
      // that was stored when the user first logged in. Do NOT log them out.
      const cached = TokenManager.getCachedUser();
      if (cached) {
        console.warn("Could not reach /auth/me — using cached user profile.", err?.message);
        return cached as AuthUser;
      }

      // No cached user and endpoint failed: genuine failure, log out
      console.error("No cached user and /auth/me failed. Clearing session.", err);
      TokenManager.clearToken();
      return null;
    }
  };

  const { data: user, error, mutate, isLoading } = useSWR<AuthUser | null>("/auth/me", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  const logout = () => {
    TokenManager.clearToken();
    mutate(null, false);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // The fetcher now handles all error cases internally and never throws.
  // This effect is a last-resort safety net only.
  useEffect(() => {
    if (error) {
      console.error("Unexpected SWR error in auth context — clearing session.", error);
      TokenManager.clearToken();
      mutate(null, false);
    }
  }, [error, mutate]);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        role: user?.role || null,
        isLoading,
        mutateUser: mutate,
        logout,
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
