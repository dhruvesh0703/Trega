import { Capacitor } from '@capacitor/core';

// Automatically route API calls to the live backend when running as a native app (Capacitor)
// When running on the web, it uses the relative path (empty string) to proxy through Vite/Express.
export const getApiBaseUrl = () => {
  if (Capacitor.isNativePlatform()) {
    // Return the production URL for native apps
    return import.meta.env.VITE_API_URL || 'https://trega.in';
  }
  return '';
};
