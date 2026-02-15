import { useState } from 'react';

/**
 * Binds a debounced lookup search handler to controlled input state.
 *
 * This hook:
 * - Manages the input value for lookup search fields
 * - Invokes the provided debounced search handler on input changes
 *
 * It intentionally does NOT:
 * - Know about lookup internals
 * - Trigger fetch directly
 * - Manage selection or form state
 *
 * Typical usage:
 *
 *   const roleSearch = useLookupSearchBinding(handleRoleSearch);
 *
 *   <RoleMultiSelectDropdown {...roleSearch} />
 */
const useLookupSearchBinding = (handleSearch: (keyword: string) => void) => {
  const [inputValue, setInputValue] = useState('');

  return {
    inputValue,
    onInputChange: (value: string) => {
      setInputValue(value);
      handleSearch(value);
    },
  };
};

export default useLookupSearchBinding;
