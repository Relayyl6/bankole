import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Handles the dual-token storage strategy (localStorage preferred, Cookie fallback)
 * for both accessToken and refreshToken.
 */
export const TokenManager = {
  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      const localToken = localStorage.getItem("accessToken");
      if (localToken) return localToken;
    }
    return Cookies.get("accessToken") || null;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== "undefined") {
      const localRefresh = localStorage.getItem("refreshToken");
      if (localRefresh) return localRefresh;
    }
    return Cookies.get("refreshToken") || null;
  },
  
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token);
    }
    Cookies.set("accessToken", token, { expires: 1, secure: process.env.NODE_ENV === "production" });
  },

  setTokens: (tokens: { accessToken: string; refreshToken?: string }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem("refreshToken", tokens.refreshToken);
      }
    }
    Cookies.set("accessToken", tokens.accessToken, { expires: 1, secure: process.env.NODE_ENV === "production" });
    if (tokens.refreshToken) {
      Cookies.set("refreshToken", tokens.refreshToken, { expires: 30, secure: process.env.NODE_ENV === "production" });
    }
  },

  getCachedUser: (): any | null => {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("authUser");
      if (u) {
        try { return JSON.parse(u); } catch (e) { return null; }
      }
    }
    return null;
  },

  setCachedUser: (user: any) => {
    if (typeof window !== "undefined" && user) {
      localStorage.setItem("authUser", JSON.stringify(user));
    }
  },

  clearToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authUser");
    }
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
  }
};

interface ApiClientOptions extends Omit<RequestInit, "body"> {
  body?: any;
  requireAuth?: boolean;
  _retry?: boolean;
}

/**
 * Centralized API client for all backend requests.
 * Automatically handles JSON parsing, Auth headers, automatic refresh on 401, and error formatting.
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { body, requireAuth = true, headers: customHeaders, _retry = false, ...restOptions } = options;

  const headers = new Headers(customHeaders);

  // Automatically attach token
  if (requireAuth) {
    const token = TokenManager.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Handle JSON vs FormData
  let fetchBody = body;
  if (body instanceof FormData) {
    // Let the browser set the Content-Type automatically for FormData (including boundary)
  } else if (body && typeof body === "object") {
    headers.set("Content-Type", "application/json; charset=utf-8");
    fetchBody = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const fetchOptions: RequestInit = {
    headers,
    ...restOptions,
  };

  const method = (restOptions.method || "GET").toUpperCase();
  if (fetchBody !== undefined && method !== "GET" && method !== "HEAD") {
    fetchOptions.body = fetchBody;
  }

  const response = await fetch(url, fetchOptions);

  // If 401 Unauthorized and not already retrying, attempt token refresh
  if (response.status === 401 && requireAuth && !_retry && !endpoint.includes("/auth/")) {
    const refreshToken = TokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.accessToken) {
            TokenManager.setTokens({
              accessToken: refreshData.accessToken,
              refreshToken: refreshData.refreshToken || refreshToken,
            });

            // Retry original request with new access token
            return apiClient<T>(endpoint, {
              ...options,
              _retry: true,
            });
          }
        } else {
          TokenManager.clearToken();
        }
      } catch {
        TokenManager.clearToken();
      }
    }
  }

  // If No Content
  if (response.status === 204) {
    return {} as T;
  }

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    // If backend returns the standard error envelope
    if (responseData?.error) {
      throw new Error(responseData.error.message || "An API error occurred");
    }
    throw new Error(responseData?.message || `HTTP error! status: ${response.status}`);
  }

  return responseData as T;
}
