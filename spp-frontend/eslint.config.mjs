import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  { ignores: ['.next/**', 'node_modules/**'] },
  ...nextCoreWebVitals,
  {
    rules: {
      // Every data hook in this app (useAuth, useActivities, useFeatures,
      // useProfileAttributes, usePredictionHistory, useAdmin, ...) follows the
      // same fetch-on-mount-with-AbortController-cleanup shape that the React
      // docs themselves recommend for synchronizing with an external system
      // ("You Might Not Need an Effect" / "Synchronizing with Effects"). This
      // rule flags that shape unconditionally; disabled rather than
      // restructured, since restructuring would replace an idiomatic,
      // well-tested pattern used consistently app-wide with a workaround for
      // this specific rule.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
