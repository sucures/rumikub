import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAntiCheatMe } from '../api/antiCheat';
import { useUserStore } from '../store/userStore';

/**
 * Soft warning banner when user has triggered suspicious events.
 * No accusations, just "Unusual activity detected" notice.
 */
export function AntiCheatWarning() {
  const token = useUserStore((s) => s.token);
  const { data, isSuccess } = useQuery({
    queryKey: ['anti-cheat-me'],
    queryFn: getAntiCheatMe,
    staleTime: 60 * 1000,
    enabled: !!token,
  });

  if (!isSuccess || !data?.hasSuspicious) return null;

  return (
    <div
      className="py-2 px-4 text-center text-sm bg-amber-900/30 border-b border-amber-700/50 text-amber-200"
      role="alert"
    >
      Unusual activity detected. Please ensure you follow the game rules. Contact support if you have questions.
    </div>
  );
}
