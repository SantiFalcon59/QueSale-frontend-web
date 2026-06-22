import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quesale.app',
  appName: 'QueSale',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '388984905641-a9rblpmb30l25v85jgfcg383o0b5rtg7.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
      icon: "ic_notification",
      iconColor: "#732ee4",
    } as any,
  },
};

export default config;
