// Parameters of the deployed Ridge model (ridge_model_final.joblib), used ONLY
// for the public landing-page preview so a visitor can move two sliders and see
// a score without an account. Real predictions always come from POST /predict.
const MODEL = {
  mean: [79.8736, 19.9671, 75.0611, 1.4995],
  scale: [11.5181, 5.9927, 14.4052, 1.2333],
  coef: {
    Attendance: 2.2916,
    Hours_Studied: 1.7482,
    Previous_Scores: 0.6949,
    Tutoring_Sessions: 0.633,
    Access_to_Resources: 1.009,
    Parental_Involvement: 1.0078,
  },
  intercept: 65.01295,
};

const LEVEL_INDEX = { Low: 0, Medium: 1, High: 2 } as const;

export type PreviewInput = {
  Attendance: number;
  Hours_Studied: number;
  Previous_Scores: number;
  Tutoring_Sessions: number;
  Access_to_Resources: keyof typeof LEVEL_INDEX;
  Parental_Involvement: keyof typeof LEVEL_INDEX;
};

export function previewScore(v: PreviewInput): number {
  const { mean, scale, coef, intercept } = MODEL;
  const y =
    intercept +
    (coef.Attendance * (v.Attendance - mean[0])) / scale[0] +
    (coef.Hours_Studied * (v.Hours_Studied - mean[1])) / scale[1] +
    (coef.Previous_Scores * (v.Previous_Scores - mean[2])) / scale[2] +
    (coef.Tutoring_Sessions * (v.Tutoring_Sessions - mean[3])) / scale[3] +
    coef.Access_to_Resources * LEVEL_INDEX[v.Access_to_Resources] +
    coef.Parental_Involvement * LEVEL_INDEX[v.Parental_Involvement];
  return Math.round(Math.min(100, Math.max(0, y)) * 10) / 10;
}
