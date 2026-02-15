import { useCallback, useState } from 'react';
import type { LookupQuery } from '@features/lookup';
import { LookupPagination } from '@shared-types/pagination';

interface LookupControllerOptions {
  /** Fetch function from lookup hook */
  fetch: (params: LookupQuery) => void;

  /** Current options array */
  options: { id: string }[] | unknown[];
}

/**
 * Generic controller for lookup dropdowns.
 *
 * Responsibilities:
 * - Owns lookup keyword state
 * - Performs lazy initial fetch on dropdown open
 * - Supports incremental pagination (limit / offset)
 * - Resets keyword automatically when options are cleared
 *
 * Design notes:
 * - Does NOT debounce input internally
 * - Fetch strategy (immediate vs debounced) is controlled by the caller
 * - Safe to reuse across Product / SKU / Packaging / Supplier lookups
 * - Stateless with respect to selected values
 *
 * Intended usage:
 * - Pair with useMultiSelectBinding
 * - Pair with debounced search handlers where needed
 */
const useLookupController = ({ fetch, options }: LookupControllerOptions) => {
  const [keyword, setKeyword] = useState('');

  const handleOpen = useCallback(() => {
    if (!options.length) {
      fetch({ keyword, offset: 0 });
    }
  }, [fetch, options.length, keyword]);

  const handleFetchNextPage = useCallback(
    (next?: LookupPagination) => {
      fetch({
        keyword: keyword || '',
        limit: next?.limit,
        offset: next?.offset,
      });
    },
    [fetch, keyword]
  );

  const handleInputChange = useCallback((value: string) => {
    setKeyword(value);
  }, []);

  /** Reset lookup keyword only (does not clear options) */
  const reset = useCallback(() => {
    setKeyword('');
  }, []);

  return {
    keyword,
    setKeyword,
    handleOpen,
    handleFetchNextPage,
    handleInputChange,
    reset,
  };
};

export default useLookupController;
