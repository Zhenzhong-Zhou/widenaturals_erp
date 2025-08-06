import type { Dispatch, SetStateAction } from 'react';
import type { LookupQuery } from '@features/lookup/state';
import usePaginatedDropdown from '@features/lookup/hooks/usePaginatedDropdown';

/**
 * Extracts the return type of `usePaginatedDropdown` hook for a given `LookupQuery` type.
 *
 * This utility type is used to infer the complete return structure of the `usePaginatedDropdown` hook,
 * including state, fetch/update methods, and metadata for pagination.
 *
 * @template T - A specific lookup query parameter type extending `LookupQuery`
 *
 * @example
 * type CustomerDropdown = UsePaginatedDropdownReturn<CustomerLookupQuery>;
 */
export type UsePaginatedDropdownReturn<T extends LookupQuery> = ReturnType<typeof usePaginatedDropdown<T>>;

/**
 * Extracts `fetchParams` and a safe `setFetchParams` function from a paginated dropdown state.
 *
 * Useful for updating only the `fetchParams` portion of a paginated state object while preserving immutability.
 *
 * @template TParams - The type of the query parameters, extending `LookupQuery`.
 * @template TState - The type of the component state, which must include `fetchParams`.
 * @param state - The current state object containing `fetchParams`.
 * @param setState - The state setter function from `useState`.
 * @returns An object containing:
 *   - `fetchParams`: current fetch parameters
 *   - `setFetchParams`: function to update fetchParams (accepts object or updater function)
 */
export const extractPaginatedHandlers = <
  TParams extends LookupQuery,
  TState extends { fetchParams: TParams }
>(
  state: TState,
  setState: Dispatch<SetStateAction<TState>>
) => {
  return {
    fetchParams: state.fetchParams,
    setFetchParams: (updater: SetStateAction<TParams>) =>
      setState((prev) => {
        const fetchParams =
          typeof updater === 'function'
            ? updater(prev.fetchParams)
            : updater;
        
        return {
          ...prev,
          fetchParams,
        };
      }),
  };
};

/**
 * Initializes a paginated dropdown state object with default values.
 *
 * Merges optional overrides into a default structure with:
 *   - `inputValue`: string input from user (default: empty string)
 *   - `fetchParams`: includes `keyword`, `limit`, `offset`, and any overrides
 *
 * @template TParams - The query parameter type extending `LookupQuery`.
 * @param overrides - Optional object containing:
 *   - any partial fetchParams
 *   - `inputValue` for the dropdown input field
 * @returns An object with:
 *   - `inputValue`: the text input state
 *   - `fetchParams`: the fetch parameters to send to the lookup API
 */
export const getDefaultPaginatedDropdownState = <
  TParams extends LookupQuery
>(
  overrides?: Partial<TParams> & { inputValue?: string }
) => {
  const { inputValue, ...fetchOverrides } = overrides ?? {};
  
  return {
    inputValue: inputValue ?? '',
    fetchParams: {
      keyword: '',
      limit: 10,
      offset: 0,
      ...fetchOverrides,
    } as TParams,
  };
};

/**
 * Represents a bundled paginated dropdown state and its handlers.
 */
export interface PaginatedDropdownBundle<T extends LookupQuery> {
  dropdownState: ReturnType<typeof usePaginatedDropdown<T>>['dropdownState'];
  setDropdownState: ReturnType<typeof usePaginatedDropdown<T>>['setDropdownState'];
  fetchParams: T;
  setFetchParams: ReturnType<typeof usePaginatedDropdown<T>>['setFetchParams'];
}

/**
 * Creates a standardized dropdown bundle using the `usePaginatedDropdown` hook.
 *
 * Useful for managing search keyword, pagination state, and fetch params for lookup dropdowns.
 *
 * @template T - The type of lookup query parameters (must extend `LookupQuery`)
 * @param options - Optional initial query parameters (e.g., limit, keyword, filters)
 * @returns An object containing state and setters for dropdown usage
 */
export const createDropdownBundle = <T extends LookupQuery>(
  options?: Partial<T>
): PaginatedDropdownBundle<T> => {
  const {
    dropdownState,
    setDropdownState,
    fetchParams,
    setFetchParams,
  } = usePaginatedDropdown<T>(options);
  
  return {
    dropdownState,
    setDropdownState,
    fetchParams,
    setFetchParams,
  };
};

/**
 * Fetches data for each provided dropdown using its internal fetchParams and fetch function.
 *
 * @param lookups - Array of dropdown objects, each containing a `fetch` function and `fetchParams`.
 */
export const fetchLookups = (
  lookups: { fetch: (params: any) => void; dropdown: PaginatedDropdownBundle<any> }[]
): void => {
  lookups.forEach(({ fetch, dropdown }) => {
    fetch(dropdown.fetchParams);
  });
};

/**
 * Resets all provided reset functions.
 *
 * @param resets - Array of objects each containing a `reset` function.
 */
export const resetLookups = (
  resets: { reset: () => void }[]
): void => {
  resets.forEach(({ reset }) => {
    reset();
  });
};
