import * as SecureStore from 'expo-secure-store';

/**
 * Token storage, split the way auth-service expects:
 *   access token  — 1 hour, memory only, never persisted
 *   refresh token — 30 days, SecureStore (Keychain / EncryptedSharedPreferences)
 *
 * auth-service keeps a single active refresh token per user, so persisting the
 * access token would only widen the window in which a stolen device replays it.
 */
const REFRESH_TOKEN_KEY = 'lunfit.refreshToken';

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearSession(): Promise<void> {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
