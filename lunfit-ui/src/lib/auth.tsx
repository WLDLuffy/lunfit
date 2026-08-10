import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { request } from '../api/client';
import { AUTH_BASE_URL, AUTH_LOGIN_URL, AUTH_REGISTER_URL } from '../api/config';
import { clearSession, getRefreshToken, setAccessToken, setRefreshToken } from './session';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

type RegisterResponse = {
  message: string;
  email: string;
  verificationEmailSent: boolean;
}

type AuthState = {
  /** Null until the stored refresh token has been checked on cold start. */
  isAuthenticated: boolean | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * Set EXPO_PUBLIC_AUTH_URL to hit the real auth-service. Without it the app
 * runs against fixtures, so the UI is usable before the backend is up.
 */
const useMockAuth = !process.env.EXPO_PUBLIC_AUTH_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cold start: a stored refresh token means we can restore the session.
    // Exchanging it for an access token happens on the first authed request.
    if (useMockAuth) {
      setIsAuthenticated(false);
      return;
    }
    getRefreshToken()
      .then((token) => setIsAuthenticated(token !== null))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const createAccount = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await request<RegisterResponse>(AUTH_BASE_URL, AUTH_REGISTER_URL, {
        method: 'POST',
        auth: false,
        body: JSON.stringify({email, password})
      });
    } catch (e) {
      setError(e instanceof Error ? e.message: 'Unable to create new account');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (useMockAuth) {
        setIsAuthenticated(true);
        return;
      }
      const res = await request<LoginResponse>(AUTH_BASE_URL, AUTH_LOGIN_URL, {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ email, password }),
      });
      console.log("access token: ", res.accessToken)
      setAccessToken(res.accessToken);
      await setRefreshToken(res.refreshToken);
      setIsAuthenticated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!useMockAuth) {
      // Best-effort: invalidate the refresh token server-side, but always drop
      // it locally so a failed request can't strand the user in a signed-in shell.
      try {
        await request(AUTH_BASE_URL, '/api/v1/auth/logout', { method: 'POST' });
      } catch {
        // ignore
      }
    }
    await clearSession();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, error, createAccount, signIn, signOut }),
    [isAuthenticated, isLoading, error, createAccount, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
