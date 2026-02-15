import { useCallback } from 'react';
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { MultiSelectOption } from '@components/common/MultiSelectDropdown';
import type { LookupQuery } from '@features/lookup';
import {
  useLookupController,
  useMultiSelectBinding,
} from '@features/lookup/hooks';

/**
 * Configuration parameters for useFilterLookup.
 *
 * @template TLookupBundle - Lookup bundle type (product, SKU, packaging, etc.)
 */
interface UseFilterLookupParams<TLookupBundle> {
  /** RHF field name (e.g. "productIds", "skuIds") */
  fieldName: string;

  /** Lookup bundle providing options + fetch */
  lookup: TLookupBundle & {
    options: MultiSelectOption[];
    fetch: (params: LookupQuery) => void;
  };

  /** react-hook-form watch */
  watch: UseFormWatch<any>;

  /** react-hook-form setValue */
  setValue: UseFormSetValue<any>;

  /**
   * Optional debounced search hook factory.
   *
   * Example:
   *   useProductSearchHandlers
   *   useSkuSearchHandlers
   */
  useSearchHandlers?: (lookup: TLookupBundle) => {
    handleSearch: (value: string) => void;
  };
}

/**
 * Feature-level hook for managing lookup filters inside filter panels.
 *
 * Responsibilities:
 * - Binds lookup options to react-hook-form multi-select fields
 * - Manages lookup keyword state via useLookupController
 * - Supports lazy loading on open
 * - Supports incremental pagination
 * - Optionally integrates debounced search handlers
 *
 * Design principles:
 * - Composes smaller hooks instead of reimplementing logic
 * - Does NOT manage selected values directly
 * - Does NOT debounce internally
 * - Safe to reuse across all filter panels
 *
 * Typical usage:
 * ```
 * const productLookup = useFilterLookup({
 *   fieldName: 'productIds',
 *   lookup: product,
 *   watch,
 *   setValue,
 *   useSearchHandlers: useProductSearchHandlers,
 * });
 * ```
 */
const useFilterLookup = <TLookup>({
  fieldName,
  lookup,
  watch,
  setValue,
  useSearchHandlers,
}: UseFilterLookupParams<TLookup>) => {
  // Low-level lookup state (keyword, pagination, open)
  const controller = useLookupController({
    options: lookup.options,
    fetch: lookup.fetch,
  });

  // Optional debounced search integration
  const searchHandlers = useSearchHandlers ? useSearchHandlers(lookup) : null;

  /**
   * Input change handler:
   * - Updates keyword state only
   * - Delegates fetching to debounced handler if provided
   */
  const handleInputChange = useCallback(
    (value: string) => {
      controller.handleInputChange(value);
      searchHandlers?.handleSearch(value);
    },
    [controller.handleInputChange, searchHandlers]
  );

  // RHF ↔ lookup multi-select binding
  const multiSelect = useMultiSelectBinding({
    watch,
    setValue,
    fieldName,
    options: lookup.options,
  });

  return {
    // Selected values + onSelect handler
    ...multiSelect,

    // Lookup control API
    keyword: controller.keyword,
    onOpen: controller.handleOpen,
    onFetchMore: controller.handleFetchNextPage,
    onInputChange: handleInputChange,
    reset: controller.reset,
  };
};

export default useFilterLookup;
