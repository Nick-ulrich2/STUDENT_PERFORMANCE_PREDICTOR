'use client';

import { useCallback, useMemo } from 'react';
import type { UserSummary } from '@/types/auth';

// Predictions carry a user id only; the admin screens show e-mails, so ids are
// resolved against the user list (falling back to a short id if the account is gone).
export function useEmailLookup(users: UserSummary[]) {
  const map = useMemo(() => new Map(users.map((u) => [u.id, u.email ?? u.id])), [users]);
  return useCallback((userId: string) => map.get(userId) ?? `${userId.slice(0, 8)}…`, [map]);
}
