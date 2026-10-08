'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  AuthResult,
  AuthUser,
  LoginCredentials,
  RegisterResult,
  UserRole,
} from '@/types/auth';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
};

// The role is read from app_metadata, which only the service role can write
// (never user_metadata, which the user controls). This is for routing and
// display only: the API re-checks the signed token on every request.
function roleOf(metadata: unknown): UserRole {
  if (metadata && typeof metadata === 'object' && 'role' in metadata) {
    return (metadata as { role?: string }).role === 'admin' ? 'admin' : 'student';
  }
  return 'student';
}

function stateFromSession(session: Session | null): AuthState {
  if (!session) return { user: null, token: null, loading: false };
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      role: roleOf(session.user.app_metadata),
    },
    token: session.access_token,
    loading: false,
  };
}

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  configured: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (credentials: LoginCredentials) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  isLoggingOut: () => boolean;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const INVALID_CREDENTIALS = 'E-mail ou mot de passe incorrect.';
const NOT_CONFIGURED = 'Supabase non configuré.';

function frenchAuthError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  if (/invalid login credentials/i.test(message)) return INVALID_CREDENTIALS;
  if (/already registered|already exists/i.test(message)) return 'Un compte existe déjà avec cet e-mail.';
  if (/email not confirmed/i.test(message)) return 'Confirmez votre e-mail avant de vous connecter.';
  if (/rate limit/i.test(message)) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  return message;
}

// One provider, one session resolution for the whole app: with a bare hook each
// call site restored the session on its own and a page could fire its data
// requests with token=null before the restore finished.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });
  const loggingOut = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      const id = requestAnimationFrame(() => setState({ user: null, token: null, loading: false }));
      return () => cancelAnimationFrame(id);
    }
    const client = supabase;
    let mounted = true;

    client.auth.getSession().then(({ data }) => {
      if (mounted) setState(stateFromSession(data.session));
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) setState(stateFromSession(session));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async ({ email, password }: LoginCredentials): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return { ok: false, error: frenchAuthError(error?.message, 'Connexion impossible.') };
    }
    setState(stateFromSession(data.session));
    return { ok: true };
  }, []);

  const register = useCallback(async ({ email, password }: LoginCredentials): Promise<RegisterResult> => {
    if (!supabase) return { status: 'error', error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { status: 'error', error: frenchAuthError(error.message, 'Inscription impossible.') };
    }
    if (!data.session) return { status: 'confirm' };
    setState(stateFromSession(data.session));
    return { status: 'session' };
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error && /rate limit/i.test(error.message)) {
      return { ok: false, error: frenchAuthError(error.message, 'Envoi impossible.') };
    }
    // Same answer whether or not the address has an account: no user enumeration.
    return { ok: true };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: frenchAuthError(error.message, 'Mise à jour impossible.') };
    return { ok: true };
  }, []);

  // Lets route guards tell a deliberate sign-out (go home) from an expired or
  // missing session (go to the login page and come back after).
  const isLoggingOut = useCallback(() => loggingOut.current, []);

  const logout = useCallback(async () => {
    loggingOut.current = true;
    setTimeout(() => (loggingOut.current = false), 3000);
    if (supabase) await supabase.auth.signOut();
    setState({ user: null, token: null, loading: false });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.user && state.token),
      configured: isSupabaseConfigured,
      login,
      register,
      logout,
      isLoggingOut,
      requestPasswordReset,
      updatePassword,
    }),
    [state, login, register, logout, isLoggingOut, requestPasswordReset, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used within <AuthProvider>.');
  return ctx;
}
