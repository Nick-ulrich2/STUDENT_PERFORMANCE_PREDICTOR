'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePredictionList } from '@/hooks/usePredictionList';
import type { UserRole, UserSummary } from '@/types/auth';

export function useAdminPredictions(token: string | null) {
  return usePredictionList(api.getAllPredictions, token);
}

type UsersState = {
  loading: boolean;
  error: string | null;
  users: UserSummary[];
};

export function useAdminUsers(token: string | null) {
  const [state, setState] = useState<UsersState>({ loading: true, error: null, users: [] });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setState({ loading: false, error: 'Authentification requise.', users: [] });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      const response = await api.getUsers({ token, signal });
      if (signal?.aborted) return;
      if (!response.ok) {
        setState({ loading: false, error: response.error.detail, users: [] });
        return;
      }
      setState({ loading: false, error: null, users: response.data });
    },
    [token],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const setRole = useCallback(
    async (userId: string, role: UserRole) => {
      setActionError(null);
      setUpdatingId(userId);
      const response = await api.updateUserRole(userId, role, { token });
      setUpdatingId(null);
      if (!response.ok) {
        setActionError(response.error.detail);
        return false;
      }
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === userId ? response.data : u)),
      }));
      return true;
    },
    [token],
  );

  return { ...state, updatingId, actionError, refresh: () => load(), setRole };
}
