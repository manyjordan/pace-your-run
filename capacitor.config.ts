import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pace.runapp',
  appName: 'Pace',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    backgroundColor: '#000000',
    allowsLinkPreview: false,
    scrollEnabled: false,
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
