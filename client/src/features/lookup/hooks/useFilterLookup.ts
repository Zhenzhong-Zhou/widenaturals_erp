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
  
  /**
   * Optional per-option formatter applied at the binding layer.
   *
   * Runs once over `lookup.options` and the result is reused for both
   * dropdown rendering and `selectedOptions` derivation, keeping menu
   * items and selected chips visually in sync.
   *
   * Define at module scope or wrap with useCallback to keep the
   * reference stable across renders.
   *
   * Example:
   *   const formatInactiveOption = (opt) =>
   *     opt.isActive === false
   *       ? { ...opt, label: `${opt.label} (Inactive)` }
   *       : opt;
   */
  formatOption?: (option: MultiSelectOption) => MultiSelectOption;
}

/**
 * Feature-level hook for managing lookup filters inside filter panels.
 *
 * Responsibilities:
 * - Binds lookup options to react-hook-form multi-select fields
 * - Manages lookup keyword state via useLookupController
 * - Supports lazy loading on open and incremental pagination
 * - Optionally integrates debounced search handlers
 * - Optionally applies a per-option formatter (e.g. label casing,
 *   inactive markers) once at the binding layer
 *
 * Design principles:
 * - Composes smaller hooks instead of reimplementing logic
 * - Does NOT manage selected values directly
 * - Does NOT debounce internally
 * - Safe to reuse across all filter panels
 *
 * Important: the returned `options` array reflects the formatted list
 * when `formatOption` is provided. Callsites should bind the dropdown's
 * `options` prop to this returned value rather than to the raw
 * `lookup.options`, so dropdown items and selected chips stay
 * visually in sync.
 *
 * Typical usage:
 * ```
 * const productLookup = useFilterLookup({
 *   fieldName: 'productIds',
 *   lookup: product,
 *   watch,
 *   setValue,
 *   useSearchHandlers: useProductSearchHandlers,
 *   formatOption: formatInactiveOption, // optional
 * });
 *
 * <ProductMultiSelectDropdown
 *   options={productLookup.options}
 *   selectedOptions={productLookup.selectedOptions}
 *   onChange={productLookup.handleSelect}
 *   ...
 * />
 * ```
 */
const useFilterLookup = <TLookup>({
                                    fieldName,
                                    lookup,
                                    watch,
                                    setValue,
                                    useSearchHandlers,
                                    formatOption,
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
  
  // RHF ↔ lookup multi-select binding (applies optional formatter)
  const multiSelect = useMultiSelectBinding({
    watch,
    setValue,
    fieldName,
    options: lookup.options,
    formatOption,
  });
  
  return {
    // Selected values, onSelect handler, and formatted options
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
