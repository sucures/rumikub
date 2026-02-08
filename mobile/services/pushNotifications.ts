import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { registerPushToken, sendTestPushNotification } from '../api/push';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    return tokenData.data ?? null;
  } catch {
    return null;
  }
}

export async function setupPushNotifications(): Promise<void> {
  const token = await registerForPushNotifications();
  if (token) {
    try {
      await registerPushToken(token, {
        platform: Platform.OS,
      });
      console.log('[push] Token registered');
    } catch (err) {
      console.warn('[push] Failed to register token:', err);
    }
  }
}

/** Call to send a test push notification to the current device */
export async function sendTestPush(): Promise<void> {
  const token = await registerForPushNotifications();
  if (!token) {
    throw new Error('No push token available. Grant notification permissions first.');
  }
  await sendTestPushNotification(
    token,
    'Test',
    'Push notification from Rummikub',
    { screen: 'profile' }
  );
}

function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  if (!data) return;
  const screen = data.screen as string | undefined;
  const url = data.url as string | undefined;
  if (url && typeof url === 'string') {
    Linking.openURL(url).catch(() => {});
    return;
  }
  if (screen && typeof screen === 'string') {
    const path = `/${screen}`;
    Linking.openURL(Linking.createURL(path)).catch(() => {});
  }
}

export function addNotificationListeners(): {
  removeReceived: () => void;
  removeResponse: () => void;
} {
  const received = Notifications.addNotificationReceivedListener(() => {
    // Notification received while app is in foreground
  });
  const response = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
  return {
    removeReceived: () => received.remove(),
    removeResponse: () => response.remove(),
  };
}
