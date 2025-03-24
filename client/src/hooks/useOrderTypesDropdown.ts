import { useMemo, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchOrderTypesDropDownThunk,
  selectOrderTypesDropdown,
  selectOrderTypesByCategory,
  selectOrderTypesDropdownLoading,
  selectOrderTypesDropdownError,
} from '../features/order';

const useOrderTypesDropdown = (category?: string) => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const allOrderTypes = useAppSelector(selectOrderTypesDropdown);
  const orderTypesByCategory = useAppSelector(selectOrderTypesByCategory);
  const loading = useAppSelector(selectOrderTypesDropdownLoading);
  const error = useAppSelector(selectOrderTypesDropdownError);
  
  const orderTypes = useMemo(() => {
    if (category && orderTypesByCategory[category]) {
      return orderTypesByCategory[category];
    }
    return allOrderTypes;  // If no category, return all
  }, [category, orderTypesByCategory, allOrderTypes]);
  
  // Prepare dropdown options
  const dropdownOptions = useMemo(
    () => orderTypes.map(({ id, name, category }) => ({
      value: id,
      label: name,
      category  // Include category in the dropdown options
    })),
    [orderTypes]
  );
  
  // Refresh function
  const refreshOrderTypes = useCallback(() => {
    dispatch(fetchOrderTypesDropDownThunk());
  }, [dispatch]);
  
  // Fetch data on mount
  useEffect(() => {
    if (allOrderTypes.length === 0) {
      dispatch(fetchOrderTypesDropDownThunk());
    }
  }, [dispatch, allOrderTypes.length]);
  
  return { dropdownOptions, loading, error, refreshOrderTypes };
};

export default useOrderTypesDropdown;
