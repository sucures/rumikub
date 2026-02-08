import { apiClient } from './client';

export async function registerPushToken(
  token: string,
  deviceInfo?: Record<string, unknown>
): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>('/api/push/register', {
    token,
    deviceInfo: deviceInfo ?? {},
  });
  if (!data.success) throw new Error('Failed to register push token');
}

export async function sendTestPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const { data: res } = await apiClient.post<{ success: boolean }>('/api/push/send', {
    token,
    title,
    body,
    data: data ?? {},
  });
  if (!res?.success) throw new Error('Failed to send push notification');
}
