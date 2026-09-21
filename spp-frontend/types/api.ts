export interface ApiError {
  detail: string;
  status?: number;
}

export interface ApiResult<T> {
  ok: true;
  data: T;
}
export interface ApiFailure {
  ok: false;
  error: ApiError;
}
export type ApiResponse<T> = ApiResult<T> | ApiFailure;

export interface RequestOptions {
  token?: string | null;
  signal?: AbortSignal;
}
