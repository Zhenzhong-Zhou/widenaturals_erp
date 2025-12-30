import { requestWithPolicy } from './requestWithPolicy';
import { REQUEST_POLICIES, RequestPolicyKey } from './requestPolicies';

/**
 * Executes a request using a named transport policy.
 *
 * Provides a type-safe bridge between semantic policy intent
 * (READ, WRITE, AUTH, CRITICAL) and concrete retry/timeout behavior.
 */
export const requestWithNamedPolicy = async <T>(
  requestFn: (signal?: AbortSignal) => Promise<T>,
  policyKey: RequestPolicyKey
): Promise<T> => {
  return requestWithPolicy(
    requestFn,
    REQUEST_POLICIES[policyKey]
  );
};
