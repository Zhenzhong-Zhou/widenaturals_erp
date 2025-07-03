import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectAddressCreationData,
  selectAddressCreationError,
  selectAddressCreationLoading, selectAddressCreationSuccessMessage,
} from '@features/address/state/addressCreationSelectors';
import { createAddressesThunk, type AddressInputArray } from '@features/address/state';
import { resetAddressCreation } from '@features/address/state/addressCreationSlice';

/**
 * Hook to access address creation state and actions.
 *
 * @returns Address creation state slices and dispatcher utilities.
 */
const useAddressCreation = () => {
  const dispatch = useAppDispatch();
  
  const loading = useAppSelector(selectAddressCreationLoading);
  const error = useAppSelector(selectAddressCreationError);
  const data = useAppSelector(selectAddressCreationData);
  const { success, message } = useAppSelector(selectAddressCreationSuccessMessage);
  
  /**
   * Dispatches the createAddressesThunk.
   * @param addresses The address input array to create.
   * @returns The result of the thunk dispatch (Promise of API response or reject value)
   */
  const createAddresses = (addresses: AddressInputArray) =>
    dispatch(createAddressesThunk(addresses));
  
  /**
   * Resets the address creation state to its initial values.
   *
   * - Clears loading, error, data, success, and message fields.
   * - Useful for cleaning up state after form submission or when leaving a page.
   */
  const resetAddressesCreation = () => dispatch(resetAddressCreation());
  
  return {
    loading,
    error,
    data,
    success,
    message,
    createAddresses,
    resetAddressesCreation,
  };
};

export default useAddressCreation;
