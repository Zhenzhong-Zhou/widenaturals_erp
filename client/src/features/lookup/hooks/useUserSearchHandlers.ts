import { useDebouncedSearch } from '@utils/hooks';
import type { UserLookupParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's USER lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with
 * `UserLookupQueryParams`.
 */
export type UserLookupBundle = {
  fetch: (params?: UserLookupParams) => void;
};

/**
 * Generic debounced search handler for user-based lookups.
 *
 * This hook adapts a user lookup bundle into a standardized
 * `handleSearch` API so it can be consumed consistently by shared lookup
 * and filter utilities.
 *
 * Works for:
 *  - Activity log "performed by" filters
 *  - Assignment / ownership selectors
 *  - Audit trail user filters (future)
 *  - Permission / role flows (future)
 *
 * Mirrors:
 * - useProductSearchHandlers
 * - useSkuSearchHandlers
 * - usePackagingMaterialSearchHandlers
 *
 * Keeps debounce and fetch strategy outside UI components.
 */
const useUserSearchHandlers = (bundle: UserLookupBundle) => {
  const handleSearch = useDebouncedSearch<UserLookupParams>(bundle.fetch);

  return {
    /**
     * Debounced handler for user keyword searches.
     *
     * Usage:
     *   const { handleSearch } = useUserSearchHandlers(userLookup);
     *
     *   handleSearch(keyword);
     */
    handleSearch,
  };
};

export default useUserSearchHandlers;
