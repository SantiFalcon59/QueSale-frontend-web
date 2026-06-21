import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { api } from './apiClient';

let navigateFn: ((path: string) => void) | null = null;
let isInitialized = false;

/**
 * Sets the global navigator function from React Router
 */
export const setGlobalNavigator = (navigate: (path: string) => void) => {
  navigateFn = navigate;
};

/**
 * Helper to navigate to target paths inside the app
 */
export const navigateTo = (path: string) => {
  if (navigateFn) {
    navigateFn(path);
  } else {
    console.warn(`[PushNotificationService] Navigation function not set, fallback using window.location.pathname. Path: ${path}`);
    window.location.pathname = path;
  }
};

/**
 * Initializes native push notification registration and event listeners
 */
export const initPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[PushNotificationService] Not running on a native platform. Skipping push initialization.');
    return;
  }

  if (isInitialized) {
    console.log('[PushNotificationService] Push notifications already initialized.');
    return;
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[PushNotificationService] User denied push notifications permission.');
      return;
    }

    // Register with FCM
    await PushNotifications.register();
    isInitialized = true;
    setupPushListeners();
  } catch (error) {
    console.error('[PushNotificationService] Error initializing push notifications:', error);
  }
};

/**
 * Set up listeners for Capacitor push notifications
 */
const setupPushListeners = () => {
  // On successful registration, send the token to the server
  PushNotifications.addListener('registration', async (token) => {
    console.log('[PushNotificationService] Push registration success, token:', token.value);
    try {
      const lastRegisteredToken = localStorage.getItem('last_registered_fcm_token');
      if (lastRegisteredToken !== token.value) {
        await api.registerDeviceToken(token.value);
        localStorage.setItem('last_registered_fcm_token', token.value);
        console.log('[PushNotificationService] FCM Token registered on backend.');
      }
    } catch (err) {
      console.error('[PushNotificationService] Failed to register FCM token on backend:', err);
    }
  });

  // Listen for registration errors
  PushNotifications.addListener('registrationError', (error) => {
    console.error('[PushNotificationService] Push registration error:', error);
  });

  // Listen for incoming notifications when the app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[PushNotificationService] Push notification received in foreground:', notification);
  });

  // Listen for notification tap actions (opens the app from background)
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('[PushNotificationService] Push action performed:', notification);
    const data = notification.notification.data;
    
    // Read the targetLink from the notification payload data
    const targetLink = data?.targetLink;
    if (targetLink) {
      console.log(`[PushNotificationService] Navigating to: ${targetLink}`);
      navigateTo(targetLink);
    } else if (data?.data) {
      try {
        const parsedInnerData = JSON.parse(data.data);
        if (parsedInnerData?.targetLink) {
          console.log(`[PushNotificationService] Navigating to inner targetLink: ${parsedInnerData.targetLink}`);
          navigateTo(parsedInnerData.targetLink);
        }
      } catch (e) {
        console.error('[PushNotificationService] Error parsing inner notification data:', e);
      }
    }
  });
};

/**
 * Unregisters the device token from the backend and clears all push listeners
 */
export const unregisterPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const activeToken = localStorage.getItem('last_registered_fcm_token');
    if (activeToken) {
      await api.unregisterDeviceToken(activeToken);
      localStorage.removeItem('last_registered_fcm_token');
      console.log('[PushNotificationService] Unregistered FCM token from backend.');
    }
    
    await PushNotifications.removeAllListeners();
    isInitialized = false;
  } catch (err) {
    console.error('[PushNotificationService] Error during unregisterPushNotifications:', err);
  }
};
