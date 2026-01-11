import { useDebouncedSearch } from '@utils/hooks';
import type { StatusLookupParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's status lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with StatusLookupParams.
 */
export type StatusLookupBundle = {
  fetch: (params?: StatusLookupParams) => void;
};

/**
 * Generic debounced search handler for any STATUS dropdown.
 *
 * Works for:
 *  - ProductStatusDropdown
 *  - SkuStatusDropdown
 *  - Order/Inventory/Customer Status Dropdowns (future)
 *
 * Mirrors the existing SKU/Product search handler design but generalized.
 */
const useStatusSearchHandlers = (bundle: StatusLookupBundle) => {
  return {
    /**
     * Debounced handler for status keyword searches.
     *
     * Usage:
     *   const { handleStatusSearch } = useStatusSearchHandlers(statusLookup);
     *   handleStatusSearch(keyword);
     */
    handleStatusSearch: useDebouncedSearch<StatusLookupParams>(bundle.fetch),
  };
};

export default useStatusSearchHandlers;
