import type { ResourceLevel, StudentInput } from '@/types/prediction';

// The habit-tracker data model, mirroring app/schemas.py on the backend:
// raw timestamped events with a start/stop/correction cycle, aggregated
// server-side into the six ML features. Never a single "type the numbers" form.

export type ActivityType = 'study_session' | 'tutoring_session' | 'attendance';

// The two activity types with an explicit start/stop cycle. Attendance is a
// binary daily mark handled by its own endpoint (no start/stop for it).
export type TrackedActivityType = Extract<ActivityType, 'study_session' | 'tutoring_session'>;

export type ActivityStatus =
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'present'
  | 'absent'
  | 'corrected';

export type AttendanceStatus = Extract<ActivityStatus, 'present' | 'absent'>;

export interface ActivityRecord {
  id: number;
  activity_type: ActivityType;
  status: ActivityStatus;
  started_at: string;
  ended_at: string | null;
  corrected_from: number | null;
  note: string | null;
}

export interface ActivityCorrectionPayload {
  note: string;
  started_at?: string;
  ended_at?: string;
  status?: AttendanceStatus;
}

export interface ProfileAttributesInput {
  Previous_Scores: number;
  Access_to_Resources: ResourceLevel;
  Parental_Involvement: ResourceLevel;
}

// The GET/PUT /me/profile-attributes payloads use the DB's lowercase column
// names, unlike the rest of the API (which mirrors the ML feature names).
export interface ProfileAttributesResponse {
  previous_scores: number | null;
  access_to_resources: ResourceLevel | null;
  parental_involvement: ResourceLevel | null;
}

export interface AggregatedFeatures extends StudentInput {
  window_days: number;
  days_logged: number;
}
