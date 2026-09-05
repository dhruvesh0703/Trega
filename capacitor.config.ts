import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.trega.app',
  appName: 'Trega',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    iosScheme: 'https',
    androidScheme: 'https'
  }
};

export default config;
