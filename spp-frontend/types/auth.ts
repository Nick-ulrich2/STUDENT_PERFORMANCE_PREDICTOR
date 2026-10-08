export type UserRole = 'student' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type AuthResult = { ok: true } | { ok: false; error: string };

export type RegisterResult =
  | { status: 'session' }
  | { status: 'confirm' }
  | { status: 'error'; error: string };

// Admin panel: one row of the Supabase Admin API user list (GET /admin/users).
export interface UserSummary {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}
