import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPricingTypeMetadataThunk,
  selectPricingTypeMetadata,
  selectPricingTypeMetadataError,
  selectPricingTypeMetadataLoading,
  selectPricingTypeStatusName,
} from '@features/pricingType/state';

/**
 * Custom hook to access pricing type metadata and expose a fetch function.
 *
 */
const usePricingTypeMetadata = () => {
  const dispatch = useAppDispatch();

  const data = useAppSelector(selectPricingTypeMetadata);
  const isLoading = useAppSelector(selectPricingTypeMetadataLoading);
  const error = useAppSelector(selectPricingTypeMetadataError);
  const statusName = useAppSelector(selectPricingTypeStatusName);

  /**
   * Manually trigger fetch for pricing type metadata by ID.
   * @param {string} id - UUID of the pricing type.
   */
  const fetchData = useCallback(
    (id: string) => {
      if (id) dispatch(fetchPricingTypeMetadataThunk(id));
    },
    [dispatch]
  );

  return { data, isLoading, error, statusName, fetchData };
};

export default usePricingTypeMetadata;
