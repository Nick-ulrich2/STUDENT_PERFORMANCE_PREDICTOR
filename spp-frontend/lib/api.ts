import type { ApiError, ApiResponse, RequestOptions } from '@/types/api';
import type {
  PredictionOutput,
  PredictionRecord,
  RecommendationOutput,
  RecommendationRequest,
  StudentInput,
} from '@/types/prediction';
import type {
  ActivityCorrectionPayload,
  ActivityRecord,
  AggregatedFeatures,
  AttendanceStatus,
  ProfileAttributesInput,
  ProfileAttributesResponse,
  TrackedActivityType,
} from '@/types/activity';

const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';
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
  getAllPredictions(opts: RequestOptions): Promise<ApiResponse<PredictionRecord[]>> {
    return request<PredictionRecord[]>('/admin/predictions', { method: 'GET', ...opts });
  },

  // --- Habit tracker: raw activity logs (start/stop/correction cycle) ---
  startActivity(
    activityType: TrackedActivityType,
    opts: RequestOptions,
  ): Promise<ApiResponse<ActivityRecord>> {
    return request<ActivityRecord>('/activities/start', {
      method: 'POST',
      body: JSON.stringify({ activity_type: activityType }),
      ...opts,
    });
  },
  stopActivity(activityId: number, opts: RequestOptions): Promise<ApiResponse<ActivityRecord>> {
    return request<ActivityRecord>(`/activities/${activityId}/stop`, {
      method: 'POST',
      ...opts,
    });
  },
  markAttendance(
    status: AttendanceStatus,
    logDate: string,
    opts: RequestOptions,
  ): Promise<ApiResponse<ActivityRecord>> {
    return request<ActivityRecord>('/activities/attendance', {
      method: 'POST',
      body: JSON.stringify({ status, log_date: logDate }),
      ...opts,
    });
  },
  correctActivity(
    activityId: number,
    payload: ActivityCorrectionPayload,
    opts: RequestOptions,
  ): Promise<ApiResponse<ActivityRecord>> {
    return request<ActivityRecord>(`/activities/${activityId}/correct`, {
      method: 'POST',
      body: JSON.stringify(payload),
      ...opts,
    });
  },
  listMyActivities(opts: RequestOptions): Promise<ApiResponse<ActivityRecord[]>> {
    return request<ActivityRecord[]>('/activities/me', { method: 'GET', ...opts });
  },

  // --- Habit tracker: slowly-changing profile attributes ---
  getProfileAttributes(opts: RequestOptions): Promise<ApiResponse<ProfileAttributesResponse>> {
    return request<ProfileAttributesResponse>('/me/profile-attributes', { method: 'GET', ...opts });
  },
  updateProfileAttributes(
    payload: ProfileAttributesInput,
    opts: RequestOptions,
  ): Promise<ApiResponse<ProfileAttributesResponse>> {
    return request<ProfileAttributesResponse>('/me/profile-attributes', {
      method: 'PUT',
      body: JSON.stringify(payload),
      ...opts,
    });
  },

  // --- Habit tracker: aggregation layer (raw logs -> the six ML features) ---
  getMyFeatures(
    windowDays: number,
    opts: RequestOptions,
  ): Promise<ApiResponse<AggregatedFeatures>> {
    return request<AggregatedFeatures>(`/me/features?window_days=${windowDays}`, {
      method: 'GET',
      ...opts,
    });
  },
  predictFromActivity(
    windowDays: number,
    opts: RequestOptions,
  ): Promise<ApiResponse<PredictionOutput>> {
    return request<PredictionOutput>(`/predict/from-activity?window_days=${windowDays}`, {
      method: 'POST',
      ...opts,
    });
  },

  // --- LLM recommendations (roadmap Phase 6) ---
  getRecommendation(
    payload: RecommendationRequest,
    opts: RequestOptions,
  ): Promise<ApiResponse<RecommendationOutput>> {
    return request<RecommendationOutput>('/predict/recommendation', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...opts,
    });
  },
};

export { API_BASE_URL };
