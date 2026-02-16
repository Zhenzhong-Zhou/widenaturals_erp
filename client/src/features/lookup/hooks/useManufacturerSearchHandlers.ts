import { useDebouncedSearch } from '@utils/hooks';
import type { ManufacturerLookupParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's MANUFACTURER lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with
 * ManufacturerLookupParams.
 */
export type ManufacturerLookupBundle = {
  fetch: (params?: ManufacturerLookupParams) => void;
};

/**
 * Generic debounced search handler for MANUFACTURER-based lookups.
 *
 * Works for:
 *  - Product batch manufacturer filters
 *  - Supplier-manufacturer relationship selectors
 *  - Compliance manufacturer filters
 *  - Procurement workflows
 */
const useManufacturerSearchHandlers = (
  bundle: ManufacturerLookupBundle
) => {
  const handleSearch =
    useDebouncedSearch<ManufacturerLookupParams>(bundle.fetch);
  
  return {
    /**
     * Debounced handler for manufacturer keyword searches.
     */
    handleSearch,
  };
};

export default useManufacturerSearchHandlers;
