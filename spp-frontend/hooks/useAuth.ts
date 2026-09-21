'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  SessionInfo,
} from '@/types/auth';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
  error: null,
};

function readRoleFromMetadata(metadata: unknown): 'student' | 'admin' {
  if (metadata && typeof metadata === 'object' && 'role' in metadata) {
    const role = (metadata as { role?: string }).role;
    if (role === 'admin' || role === 'student') return role;
  }
  return 'student';
}

function buildSession(
  sbUser: { id: string; email?: string | null; user_metadata?: unknown },
  token: string,
): SessionInfo {
  return {
    user: {
      id: sbUser.id,
      email: sbUser.email ?? '',
      role: readRoleFromMetadata(sbUser.user_metadata),
    },
    accessToken: token,
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!isSupabaseConfigured) {
        setState({ ...initialState, loading: false, error: 'Supabase non configuré.' });
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error || !data.session) {
        setState({ ...initialState, loading: false });
        return;
      }
      const session = buildSession(data.session.user, data.session.access_token);
      setState({
        user: session.user,
        token: session.accessToken,
        loading: false,
        error: null,
      });
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      if (!newSession) {
        setState({ ...initialState, loading: false });
        return;
      }
      const session = buildSession(newSession.user, newSession.access_token);
      setState({
        user: session.user,
        token: session.accessToken,
        loading: false,
        error: null,
      });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setState((s) => ({
        ...s,
        loading: false,
        error: error?.message ?? 'Connexion impossible.',
      }));
      return false;
    }
    return true;
  }, []);

  const register = useCallback(
    async ({ email, password, fullName, role = 'student' }: RegisterCredentials) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });
      if (error || !data.session) {
        setState((s) => ({
          ...s,
          loading: false,
          error: error?.message ?? "Inscription impossible.",
        }));
        return false;
      }
      return true;
    },
    [],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ ...initialState, loading: false });
  }, []);

  return {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    isAuthenticated: Boolean(state.user && state.token),
  };
}
