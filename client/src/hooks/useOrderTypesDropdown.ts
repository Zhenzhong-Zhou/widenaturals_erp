import { useMemo, useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchOrderTypesDropDownThunk,
  selectOrderTypesDropdown,
  selectOrderTypesDropdownError,
  selectOrderTypesDropdownLoading,
} from '../features/order';

const useOrderTypesDropdown = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const orderTypes = useAppSelector(selectOrderTypesDropdown);
  const loading = useAppSelector(selectOrderTypesDropdownLoading);
  const error = useAppSelector(selectOrderTypesDropdownError);
  
  // Memoized dropdown options
  const dropdownOptions = useMemo(
    () => orderTypes.map(({ id, name }) => ({ value: id, label: name })),
    [orderTypes]
  );
  
  // Manual refresh function
  const refreshOrderTypes = useCallback(() => {
    dispatch(fetchOrderTypesDropDownThunk());
  }, [dispatch]);
  
  // Fetch order types on component mount
  useEffect(() => {
    if (orderTypes.length === 0) {
      dispatch(fetchOrderTypesDropDownThunk());
    }
  }, [dispatch, orderTypes.length]);
  
  return { dropdownOptions, loading, error, refreshOrderTypes };
};

export default useOrderTypesDropdown;
