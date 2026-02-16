import { useDebouncedSearch } from '@utils/hooks';
import type { SupplierLookupParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's SUPPLIER lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with
 * SupplierLookupParams.
 */
export type SupplierLookupBundle = {
  fetch: (params?: SupplierLookupParams) => void;
};

/**
 * Generic debounced search handler for SUPPLIER-based lookups.
 *
 * Works for:
 *  - Purchase order supplier selectors
 *  - Packaging material supplier filters
 *  - Vendor assignment workflows
 */
const useSupplierSearchHandlers = (
  bundle: SupplierLookupBundle
) => {
  const handleSearch =
    useDebouncedSearch<SupplierLookupParams>(bundle.fetch);
  
  return {
    /**
     * Debounced handler for supplier keyword searches.
     */
    handleSearch,
  };
};

export default useSupplierSearchHandlers;
