import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mindmap.studio',
  appName: 'MindMap Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildToolsVersion: '34.0.0',
    minSdkVersion: 22,
    targetSdkVersion: 34,
    useAndroidX: true,
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#308ce8',
      showSpinner: true,
      spinnerColor: '#ffffff'
    }
  }
};

export default config;
