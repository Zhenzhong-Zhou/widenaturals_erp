import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import { useEffect } from "react";
import {
  fetchAllOrderTypesThunk,
  selectOrderTypes,
  selectOrderTypesError,
  selectOrderTypesLoading,
} from '../features/orderType';

/**
 * Custom hook to fetch and manage order types from Redux state
 */
const useOrderTypes = () => {
  const dispatch = useAppDispatch();
  const orderTypes = useAppSelector(selectOrderTypes);
  const isLoading = useAppSelector(selectOrderTypesLoading);
  const error = useAppSelector(selectOrderTypesError);
  
  useEffect(() => {
    if (orderTypes.length === 0) {
      dispatch(fetchAllOrderTypesThunk());
    }
  }, [dispatch, orderTypes.length]);
  
  return { orderTypes, isLoading, error };
};

export default useOrderTypes;
