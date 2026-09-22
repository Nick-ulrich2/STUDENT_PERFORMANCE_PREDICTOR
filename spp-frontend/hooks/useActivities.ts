'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type {
  ActivityCorrectionPayload,
  ActivityRecord,
  AttendanceStatus,
  TrackedActivityType,
} from '@/types/activity';

type State = {
  loading: boolean;
  error: string | null;
  activities: ActivityRecord[];
};

const initial: State = { loading: true, error: null, activities: [] };

export function useActivities(token: string | null) {
  const [state, setState] = useState<State>(initial);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setState({ loading: false, error: 'Authentification requise.', activities: [] });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      const response = await api.listMyActivities({ token, signal });
      if (signal?.aborted) return;
      if (!response.ok) {
        setState({ loading: false, error: response.error.detail, activities: [] });
        return;
      }
      setState({ loading: false, error: null, activities: response.data });
    },
    [token],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const start = useCallback(
    async (activityType: TrackedActivityType) => {
      setActionError(null);
      const response = await api.startActivity(activityType, { token });
      if (!response.ok) {
        setActionError(response.error.detail);
        return null;
      }
      await load();
      return response.data;
    },
    [token, load],
  );

  const stop = useCallback(
    async (activityId: number) => {
      setActionError(null);
      const response = await api.stopActivity(activityId, { token });
      if (!response.ok) {
        setActionError(response.error.detail);
        return null;
      }
      await load();
      return response.data;
    },
    [token, load],
  );

  const markAttendance = useCallback(
    async (status: AttendanceStatus, logDate: string) => {
      setActionError(null);
      const response = await api.markAttendance(status, logDate, { token });
      if (!response.ok) {
        setActionError(response.error.detail);
        return null;
      }
      await load();
      return response.data;
    },
    [token, load],
  );

  const correct = useCallback(
    async (activityId: number, payload: ActivityCorrectionPayload) => {
      setActionError(null);
      const response = await api.correctActivity(activityId, payload, { token });
      if (!response.ok) {
        setActionError(response.error.detail);
        return null;
      }
      await load();
      return response.data;
    },
    [token, load],
  );

  return {
    ...state,
    actionError,
    refresh: () => load(),
    start,
    stop,
    markAttendance,
    correct,
  };
}
