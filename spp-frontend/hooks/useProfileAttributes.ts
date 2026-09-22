'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ProfileAttributesInput, ProfileAttributesResponse } from '@/types/activity';

const EMPTY: ProfileAttributesResponse = {
  previous_scores: null,
  access_to_resources: null,
  parental_involvement: null,
};

type State = {
  loading: boolean;
  error: string | null;
  attributes: ProfileAttributesResponse;
};

const initial: State = { loading: true, error: null, attributes: EMPTY };

export function useProfileAttributes(token: string | null) {
  const [state, setState] = useState<State>(initial);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setState({ loading: false, error: 'Authentification requise.', attributes: EMPTY });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      const response = await api.getProfileAttributes({ token, signal });
      if (signal?.aborted) return;
      if (!response.ok) {
        setState({ loading: false, error: response.error.detail, attributes: EMPTY });
        return;
      }
      setState({ loading: false, error: null, attributes: response.data });
    },
    [token],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const save = useCallback(
    async (payload: ProfileAttributesInput) => {
      setSaving(true);
      const response = await api.updateProfileAttributes(payload, { token });
      setSaving(false);
      if (!response.ok) {
        setState((s) => ({ ...s, error: response.error.detail }));
        return false;
      }
      await load();
      return true;
    },
    [token, load],
  );

  return { ...state, saving, save, refresh: () => load() };
}
