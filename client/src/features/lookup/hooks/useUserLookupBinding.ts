import { useCallback, useState } from 'react';
import type { UserLookupParams } from '@features/lookup/state';

interface UseUserLookupBindingOptions {
  /**
   * Fetch function provided by the user lookup hook.
   * Must support pagination and keyword search via UserLookupParams.
   */
  fetchUserLookup: (params?: UserLookupParams) => void;
}

/**
 * useUserLookupBinding
 *
 * Encapsulates dropdown query state and interaction logic
 * for user-based lookup components (e.g., Created By, Updated By).
 *
 * Responsibilities:
 * - Owns pagination + keyword fetch parameters
 * - Handles keyword input changes
 * - Triggers lookup fetch on search or refresh
 * - Resets offset when keyword changes
 *
 * This hook intentionally keeps:
 * - Fetch execution logic separate from page-level state
 * - Dropdown-level query state isolated
 * - A consistent API across all user lookup usages
 *
 * Designed for reuse in:
 * - Filter panels
 * - Assignment selectors
 * - Approval workflows
 * - Audit user selectors
 *
 * Architectural Note:
 * The hook is intentionally lightweight and does not include
 * debouncing. Debounce behavior, if required, should be handled
 * at a higher abstraction layer to avoid hidden timing side effects.
 */
const useUserLookupBinding = ({
  fetchUserLookup,
}: UseUserLookupBindingOptions) => {
  const [fetchParams, setFetchParams] = useState<UserLookupParams>({
    offset: 0,
    limit: 10,
  });

  /**
   * Handles keyword search input changes.
   * Resets pagination offset and immediately triggers lookup fetch.
   */
  const handleInputChange = useCallback(
    (_: unknown, newValue: string, reason: string) => {
      if (reason !== 'input') return;

      const nextParams = {
        ...fetchParams,
        keyword: newValue,
        offset: 0,
      };

      setFetchParams(nextParams);
      fetchUserLookup(nextParams);
    },
    [fetchParams, fetchUserLookup]
  );

  /**
   * Refreshes lookup results using either:
   * - Provided params override
   * - Or current internal fetchParams state
   */
  const handleRefresh = useCallback(
    (params?: UserLookupParams) => {
      fetchUserLookup(params ?? fetchParams);
    },
    [fetchUserLookup, fetchParams]
  );

  return {
    fetchParams,
    setFetchParams,
    handleInputChange,
    handleRefresh,
  };
};

export default useUserLookupBinding;
