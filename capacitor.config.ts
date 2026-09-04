import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jabir.shadowrealm',
  appName: 'Shadow Realm',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#141414',
    allowMixedContent: true,
  },
  ios: {
    backgroundColor: '#141414',
    contentInset: 'always',
  },
};

export default config;
