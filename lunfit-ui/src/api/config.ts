import { Platform } from 'react-native';

/**
 * Base URLs for the LunFit backend services.
 *
 * Android emulators reach the host machine on 10.0.2.2, not localhost. On a
 * physical device neither works — set EXPO_PUBLIC_AUTH_URL / EXPO_PUBLIC_WORKOUT_URL
 * in `.env.local` to your machine's LAN IP.
 */
const localhost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const AUTH_BASE_URL =
  process.env.EXPO_PUBLIC_AUTH_URL ?? `http://${localhost}:8080`;

export const WORKOUT_BASE_URL =
  process.env.EXPO_PUBLIC_WORKOUT_URL ?? `http://${localhost}:8081`;

export const AUTH_LOGIN_URL = '/api/v1/auth/login';
export const AUTH_REGISTER_URL = '/api/v1/auth/register';