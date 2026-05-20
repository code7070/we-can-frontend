import { useSyncExternalStore } from "react";

const TOKEN_KEY = "taskflow_token";

/**
 * Subscribe to auth changes across the app.
 * Uses a custom "auth-change" event so the same tab (not just other tabs)
 * gets notified when the token changes.
 */
function getSnapshot(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("auth-change", callback);
  return () => window.removeEventListener("auth-change", callback);
}

/**
 * Decode the JWT payload (base64url) without verifying signature.
 * Only safe for client-side extraction of claims like sub, email, role.
 */
function decodeJwtPayload(token: string): { sub: string; email: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64url = parts[1];
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((base64url.length + 3) % 4 || 4);
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function useAuth() {
  const token = useSyncExternalStore(subscribe, getSnapshot);
  const isLoggedIn = !!token;
  const currentUser = token ? decodeJwtPayload(token) : null;
  const userId = currentUser?.sub ?? null;

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event("auth-change"));
  }

  function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event("auth-change"));
  }

  return { isLoggedIn, token, userId, logout, setToken };
}
