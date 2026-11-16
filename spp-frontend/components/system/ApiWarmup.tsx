'use client';

import { useEffect } from 'react';
import { warmUpApi } from '@/lib/api';

// Wakes the sleeping API in the background on the first page view of a session.
export function ApiWarmup() {
  useEffect(() => {
    warmUpApi();
  }, []);
  return null;
}
