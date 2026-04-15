import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pace.runapp',
  appName: 'Pace',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
