import { useDebouncedSearch } from '@utils/hooks';
import type { LocationTypeLookupParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's LOCATION TYPE lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with
 * LocationTypeLookupParams.
 */
export type LocationTypeLookupBundle = {
  fetch: (params?: LocationTypeLookupParams) => void;
};

/**
 * Generic debounced search handler for LOCATION TYPE-based lookups.
 *
 * Works for:
 *  - Location management filters
 *  - Inventory location assignment
 *  - Warehouse configuration workflows
 */
const useLocationTypeSearchHandlers = (bundle: LocationTypeLookupBundle) => {
  const handleSearch = useDebouncedSearch<LocationTypeLookupParams>(
    bundle.fetch
  );

  return {
    /**
     * Debounced handler for location type keyword searches.
     */
    handleSearch,
  };
};

export default useLocationTypeSearchHandlers;
