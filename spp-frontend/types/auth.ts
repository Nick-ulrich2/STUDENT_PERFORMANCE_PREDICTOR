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
