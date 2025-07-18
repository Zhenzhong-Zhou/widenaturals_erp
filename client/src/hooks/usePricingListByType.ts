import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPricingDetailsByTypeThunk,
  selectPricingListByType,
  selectPricingListByTypeError,
  selectPricingListByTypeLoading,
  selectPricingListByTypePagination,
} from '@features/pricing/state';

/**
 * Custom hook to access and fetch a pricing list by pricing type ID.
 *
 */
const usePricingListByType = () => {
  const dispatch = useAppDispatch();

  const data = useAppSelector(selectPricingListByType);
  const pagination = useAppSelector(selectPricingListByTypePagination);
  const loading = useAppSelector(selectPricingListByTypeLoading);
  const error = useAppSelector(selectPricingListByTypeError);

  /**
   * Dispatches the thunk to fetch a pricing list by type ID.
   *
   * @param pricingTypeId - UUID of the pricing type
   * @param page - Optional page number
   * @param limit - Optional limit per page
   */
  const fetchData = (pricingTypeId: string, page = 1, limit = 10) => {
    dispatch(fetchPricingDetailsByTypeThunk({ pricingTypeId, page, limit }));
  };

  return {
    data,
    pagination,
    loading,
    error,
    fetchData,
  };
};

export default usePricingListByType;
