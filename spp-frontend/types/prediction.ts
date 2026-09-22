export type ResourceLevel = 'Low' | 'Medium' | 'High';

export interface StudentInput {
  Attendance: number;
  Hours_Studied: number;
  Previous_Scores: number;
  Tutoring_Sessions: number;
  Access_to_Resources: ResourceLevel;
  Parental_Involvement: ResourceLevel;
}

export interface PredictionOutput {
  model_name: string;
  predicted_score: number;
  top_features: Record<string, number>;
  below_threshold: string[];
}

// LLM recommendation layer (roadmap Phase 6): the request is exactly the
// prediction the client already has — the LLM explains it, it never
// re-predicts from raw student data.
export type RecommendationRequest = Pick<
  PredictionOutput,
  'predicted_score' | 'top_features' | 'below_threshold'
>;

export interface RecommendationOutput {
  recommendation: string;
}

// The shape of a row as persisted by app/repository.py::create_prediction and
// returned as-is (select *) by GET /predictions/me and GET /admin/predictions.
// This is NOT the live /predict response (see PredictionOutput above): the
// stored row has no model_name (only model_version_id, a foreign key with no
// name join in the current query) and no top_features (those are computed at
// prediction time from the live model, not persisted).
export interface PredictionRecord {
  id: number;
  user_id: string;
  model_version_id: number;
  attendance: number;
  hours_studied: number;
  previous_scores: number;
  tutoring_sessions: number;
  access_to_resources: ResourceLevel;
  parental_involvement: ResourceLevel;
  predicted_score: number;
  below_threshold: string[] | null;
  created_at: string;
}
