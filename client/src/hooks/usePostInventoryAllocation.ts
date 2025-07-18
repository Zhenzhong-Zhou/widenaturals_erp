import { useAppDispatch } from '@store/storeHooks.ts';
import {
  type InventoryAllocationPayload,
  postInventoryAllocationThunk,
} from '@features/inventoryAllocation';
import useAllocateInventory from './useAllocateInventory';

const usePostInventoryAllocation = () => {
  const dispatch = useAppDispatch();
  const allocationState = useAllocateInventory();

  const submit = async (payload: InventoryAllocationPayload) => {
    return dispatch(postInventoryAllocationThunk(payload));
  };

  return {
    ...allocationState,
    submit,
  };
};

export default usePostInventoryAllocation;
