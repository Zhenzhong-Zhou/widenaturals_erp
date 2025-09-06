import { useState } from 'react';
import type { LookupQuery, PaginatedDropdownState } from '@features/lookup/state';
import {
  getDefaultPaginatedDropdownState,
  extractPaginatedHandlers,
} from '@utils/lookupHelpers.ts';

const usePaginatedDropdown = <TParams extends LookupQuery>(
  initialParams?: Partial<TParams>
) => {
  const [dropdownState, setDropdownState] = useState(
    getDefaultPaginatedDropdownState<TParams>(initialParams)
  );
  
  const { fetchParams, setFetchParams } = extractPaginatedHandlers<
    TParams,
    PaginatedDropdownState<TParams>
  >(dropdownState, setDropdownState);
  
  return {
    dropdownState,
    setDropdownState,
    fetchParams,
    setFetchParams,
  };
};

export default usePaginatedDropdown;
