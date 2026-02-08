import { apiClient } from './client';

export interface FriendInfo {
  id: string;
  userId: string;
  friendId: string;
  status: string;
  createdAt: string;
  friend?: { id: string; username: string; avatar: string | null; avatarUrl: string | null };
}

export interface PendingRequest {
  id: string;
  requesterId: string;
  requesterUsername: string;
  requesterAvatar: string | null;
  createdAt: string;
}

export interface SentRequest {
  id: string;
  targetId: string;
  targetUsername: string;
  createdAt: string;
}

export async function getFriends(): Promise<FriendInfo[]> {
  const { data } = await apiClient.get<{ success: boolean; friends: FriendInfo[] }>('/api/friends');
  if (!data.success) throw new Error('Failed to get friends');
  return data.friends ?? [];
}

export async function getFriendRequests(): Promise<{ pending: PendingRequest[]; sent: SentRequest[] }> {
  const { data } = await apiClient.get<{
    success: boolean;
    pending: PendingRequest[];
    sent: SentRequest[];
  }>('/api/friends/requests');
  if (!data.success) throw new Error('Failed to get requests');
  return { pending: data.pending ?? [], sent: data.sent ?? [] };
}

export async function sendFriendRequest(targetId: string): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>(`/api/friends/request/${targetId}`);
  if (!data.success) throw new Error('Failed to send request');
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>(`/api/friends/accept/${requestId}`);
  if (!data.success) throw new Error('Failed to accept request');
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>(`/api/friends/reject/${requestId}`);
  if (!data.success) throw new Error('Failed to reject request');
}

export async function removeFriend(friendId: string): Promise<void> {
  const { data } = await apiClient.delete<{ success: boolean }>(`/api/friends/${friendId}`);
  if (!data.success) throw new Error('Failed to remove friend');
}
