import { RequestPolicyOptions } from '@utils/http/requestWithPolicy.ts';

export const REQUEST_POLICIES = {
  AUTH: {
    retries: 0,
    timeoutMs: 5000,
  },
  
  READ: {
    retries: 3,
    delayMs: 500,
    timeoutMs: 3000,
  },
  
  WRITE: {
    retries: 1,
    delayMs: 1000,
    timeoutMs: 5000,
  },
  
  CRITICAL: {
    retries: 0,
    timeoutMs: 8000,
  },
} as const satisfies Record<string, RequestPolicyOptions>;

/**
 * Allowed policy keys.
 * Derived directly from REQUEST_POLICIES for type safety.
 */
export type RequestPolicyKey = keyof typeof REQUEST_POLICIES;
