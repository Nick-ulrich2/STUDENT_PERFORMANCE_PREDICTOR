'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  SessionInfo,
  UserRole,
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

async function fetchUserRoleFromBackend(accessToken: string): Promise<UserRole> {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');

  try {
    const response = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!response.ok) {
      return 'student';
    }
    const payload = await response.json().catch(() => ({ role: 'student' }));
    return payload.role === 'admin' ? 'admin' : 'student';
  } catch {
    return 'student';
  }
}

function buildSession(
  sbUser: { id: string; email?: string | null; user_metadata?: unknown },
  token: string,
  roleOverride?: UserRole,
): SessionInfo {
  const role = roleOverride ?? readRoleFromMetadata(sbUser.user_metadata);
  return {
    user: {
      id: sbUser.id,
      email: sbUser.email ?? '',
      role,
    },
    accessToken: token,
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setState({ ...initialState, loading: false, error: 'Supabase non configuré.' });
      return;
    }

    const client = supabase!;
    let mounted = true;

    async function load() {
      const { data, error } = await client.auth.getSession();
      if (!mounted) return;
      if (error || !data.session) {
        setState({ ...initialState, loading: false });
        return;
      }
      const role = await fetchUserRoleFromBackend(data.session.access_token);
      const session = buildSession(data.session.user, data.session.access_token, role);
      setState({
        user: session.user,
        token: session.accessToken,
        loading: false,
        error: null,
      });
    }

    load();

    const { data: sub } = client.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      if (!newSession) {
        setState({ ...initialState, loading: false });
        return;
      }
      const role = await fetchUserRoleFromBackend(newSession.access_token);
      const session = buildSession(newSession.user, newSession.access_token, role);
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
    if (!isSupabaseConfigured || !supabase) {
      setState((s) => ({ ...s, loading: false, error: 'Supabase non configuré.' }));
      return false;
    }

    const client = supabase!;
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setState((s) => ({
        ...s,
        loading: false,
        error: error?.message ?? 'Connexion impossible.',
      }));
      return false;
    }

    const role = await fetchUserRoleFromBackend(data.session.access_token);
    setState({
      user: {
        id: data.session.user.id,
        email: data.session.user.email ?? '',
        role,
      },
      token: data.session.access_token,
      loading: false,
      error: null,
    });
    return true;
  }, []);

  const register = useCallback(
    async ({ email, password, fullName, role = 'student' }: RegisterCredentials) => {
      if (!isSupabaseConfigured || !supabase) {
        setState((s) => ({ ...s, loading: false, error: 'Supabase non configuré.' }));
        return false;
      }

      const client = supabase!;
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data, error } = await client.auth.signUp({
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

      const backendRole = await fetchUserRoleFromBackend(data.session.access_token);
      setState({
        user: {
          id: data.session.user.id,
          email: data.session.user.email ?? '',
          role: backendRole,
        },
        token: data.session.access_token,
        loading: false,
        error: null,
      });
      return true;
    },
    [],
  );

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setState({ ...initialState, loading: false });
      return;
    }
    const client = supabase!;
    await client.auth.signOut();
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
