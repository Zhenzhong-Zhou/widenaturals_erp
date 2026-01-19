import { useDebouncedSearch } from '@utils/hooks';
import type { RoleLookupParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's ROLE lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with RoleLookupParams.
 */
export type RoleLookupBundle = {
  fetch: (params?: RoleLookupParams) => void;
};

/**
 * Generic debounced search handler for ROLE dropdowns.
 *
 * Works for:
 *  - CreateUserForm
 *  - EditUserForm
 *  - Role filters
 *  - Permission management screens (future)
 */
const useRoleSearchHandlers = (bundle: RoleLookupBundle) => {
  return {
    /**
     * Debounced handler for role keyword searches.
     *
     * Usage:
     *   const { handleRoleSearch } = useRoleSearchHandlers(roleLookup);
     *   handleRoleSearch(keyword);
     */
    handleRoleSearch: useDebouncedSearch<RoleLookupParams>(bundle.fetch),
  };
};

export default useRoleSearchHandlers;
