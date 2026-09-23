export type UserRole = 'student' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface SessionInfo {
  user: AuthUser;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
  role?: UserRole;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Admin panel: one row of the Supabase Admin API user list (GET /admin/users).
export interface UserSummary {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}
