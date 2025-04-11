import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchDiscountDropdownThunk,
  selectDiscountsError,
  selectDiscountsLoading,
  selectFormattedDiscounts,
} from '@features/discount';

const useDiscountDropdown = () => {
  const dispatch = useAppDispatch();

  // Accessing memoized selectors
  const discounts = useAppSelector(selectFormattedDiscounts);
  const loading = useAppSelector(selectDiscountsLoading);
  const error = useAppSelector(selectDiscountsError);

  // Fetching discounts when the hook is first used
  useEffect(() => {
    dispatch(fetchDiscountDropdownThunk());
  }, [dispatch]);

  // Function to refresh discounts
  const refreshDiscounts = () => {
    dispatch(fetchDiscountDropdownThunk());
  };

  return { discounts, loading, error, refreshDiscounts };
};

export default useDiscountDropdown;
