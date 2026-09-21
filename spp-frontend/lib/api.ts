import type { ApiError, ApiResponse, RequestOptions } from '@/types/api';
import type { PredictionOutput, PredictionRecord, StudentInput } from '@/types/prediction';

const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

async function request<T>(
  path: string,
  init: RequestInit & RequestOptions,
): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (init.token) {
    headers.set('Authorization', `Bearer ${init.token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? null,
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        (isJson && (payload as { detail?: string }).detail) ||
        (typeof payload === 'string' && payload) ||
        `Request failed with status ${response.status}`;
      return { ok: false, error: { detail: message, status: response.status } };
    }

    return { ok: true, data: payload as T };
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : 'Network error. Please try again.';
    return { ok: false, error: { detail, status: 0 } satisfies ApiError };
  }
}

export const api = {
  predict(input: StudentInput, opts: RequestOptions): Promise<ApiResponse<PredictionOutput>> {
    return request<PredictionOutput>('/predict', {
      method: 'POST',
      body: JSON.stringify(input),
      ...opts,
    });
  },
  getMyPredictions(opts: RequestOptions): Promise<ApiResponse<PredictionRecord[]>> {
    return request<PredictionRecord[]>('/predictions/me', { method: 'GET', ...opts });
  },
  getUserPredictions(
    userId: string,
    opts: RequestOptions,
  ): Promise<ApiResponse<PredictionRecord[]>> {
    return request<PredictionRecord[]>(`/predictions/${encodeURIComponent(userId)}`, {
      method: 'GET',
      ...opts,
    });
  },
  getAllPredictions(opts: RequestOptions): Promise<ApiResponse<PredictionRecord[]>> {
    return request<PredictionRecord[]>('/admin/predictions', { method: 'GET', ...opts });
  },
};

export { API_BASE_URL };
