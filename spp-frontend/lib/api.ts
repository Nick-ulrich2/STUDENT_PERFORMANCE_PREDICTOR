import type { ApiError, ApiResponse, RequestOptions } from '@/types/api';
import { trackRequest } from '@/lib/pending';
import { ERR_NETWORK, friendlyDetail } from '@/lib/apiErrors';
import type {
  PredictionOutput,
  PredictionRecord,
  RecommendationOutput,
  RecommendationRequest,
  StudentInput,
} from '@/types/prediction';
import type { UserRole, UserSummary } from '@/types/auth';
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

const RETRY_DELAYS_MS = [2_000, 5_000];
const RETRYABLE_STATUS = new Set([502, 503, 504]);

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// While Render wakes up its edge answers 502/503/504 (or drops the connection):
// the request never reached the API, so it is safe to try again shortly.
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt += 1) {
    const canRetry = attempt < RETRY_DELAYS_MS.length && !init.signal?.aborted;
    try {
      const response = await fetch(url, init);
      if (canRetry && RETRYABLE_STATUS.has(response.status)) {
        await wait(RETRY_DELAYS_MS[attempt] ?? 0);
        continue;
      }
      return response;
    } catch (err) {
      if (!canRetry || (err instanceof DOMException && err.name === 'AbortError')) throw err;
      await wait(RETRY_DELAYS_MS[attempt] ?? 0);
    }
  }
}

// Fire-and-forget request that starts waking the API as soon as the site opens,
// so the cold start overlaps with the time the visitor spends reading.
export function warmUpApi(): void {
  try {
    const last = Number(sessionStorage.getItem('spp:warm') ?? 0);
    if (Date.now() - last < 10 * 60_000) return;
    sessionStorage.setItem('spp:warm', String(Date.now()));
  } catch {
    /* storage unavailable: just ping */
  }
  fetch(`${API_BASE_URL}/`, { mode: 'no-cors', cache: 'no-store' }).catch(() => undefined);
}

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

  const endTracking = trackRequest();
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? null,
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const rawDetail = isJson ? (payload as { detail?: unknown }).detail : undefined;
      const message =
        (typeof rawDetail === 'string' && rawDetail) ||
        (Array.isArray(rawDetail) && rawDetail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(' ')) ||
        (typeof payload === 'string' && payload) ||
        `Request failed with status ${response.status}`;
      console.error(`[api] ${init.method ?? 'GET'} ${path} -> ${response.status}: ${message}`);
      return { ok: false, error: { detail: friendlyDetail(response.status, message), status: response.status } };
    }

    return { ok: true, data: payload as T };
  } catch (err) {
    console.error(`[api] ${init.method ?? 'GET'} ${path} failed:`, err);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, error: { detail: err.message, status: 0 } satisfies ApiError };
    }
    return { ok: false, error: { detail: ERR_NETWORK, status: 0 } satisfies ApiError };
  } finally {
    endTracking();
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
    lang: 'fr' | 'en' = 'fr',
  ): Promise<ApiResponse<RecommendationOutput>> {
    // `lang` is a query parameter (not a body field): an older API that does not
    // know it simply ignores it and answers in French.
    return request<RecommendationOutput>(`/predict/recommendation?lang=${lang}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      ...opts,
    });
  },

  // --- Admin panel: user management ---
  getUsers(opts: RequestOptions): Promise<ApiResponse<UserSummary[]>> {
    return request<UserSummary[]>('/admin/users', { method: 'GET', ...opts });
  },
  updateUserRole(
    userId: string,
    role: UserRole,
    opts: RequestOptions,
  ): Promise<ApiResponse<UserSummary>> {
    return request<UserSummary>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
      ...opts,
    });
  },
};

export { API_BASE_URL };
