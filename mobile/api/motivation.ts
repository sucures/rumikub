import { apiClient } from './client';

export async function getTodayMotivation(): Promise<{ text: string }> {
  const { data } = await apiClient.get<{ success: boolean; text: string }>('/api/motivation/today');
  if (!data.success || data.text == null) throw new Error('Failed to get motivation');
  return { text: data.text };
}

export async function setUserMotivation(text: string): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>('/api/motivation/set', { text });
  if (!data.success) throw new Error('Failed to set motivation');
}
