// apps/web/src/lib/api.ts
import { hc } from 'hono/client';
import type { AppType } from '../../../gateway/src/index';

// Create a type-safe client pointing to your gateway
export const client = hc<AppType>('http://localhost:3000/', {
  headers: {
    'Content-Type': 'application/json',
  },
  init: {
    credentials: 'include',
  }
});
