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

export interface PredictionRecord extends PredictionOutput {
  id: string;
  user_id: string;
  created_at: string;
  input: StudentInput;
}
