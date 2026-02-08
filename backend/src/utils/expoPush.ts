// Shared Expo Push API client
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export function isValidExpoPushToken(token: string): boolean {
  return typeof token === 'string' && token.startsWith('ExponentPushToken');
}

export async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const payload = {
    to: token,
    title,
    body,
    data: data ?? {},
  };
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as {
    data?: Array<{ status: string; message?: string; details?: { error?: string } }>;
    errors?: Array<{ code?: string; message?: string }>;
  };
  if (!res.ok) {
    const errMsg = json.errors?.[0]?.message ?? res.statusText ?? 'Expo Push API error';
    throw new Error(errMsg);
  }
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message ?? 'Expo Push API error');
  }
  const tickets = json.data ?? [];
  for (const t of tickets) {
    if (t.status === 'error') {
      if (t.details?.error === 'DeviceNotRegistered') {
        throw new Error('DeviceNotRegistered');
      }
      throw new Error(t.message ?? 'Push delivery failed');
    }
  }
}
