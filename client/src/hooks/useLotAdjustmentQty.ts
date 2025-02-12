import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  adjustWarehouseInventoryLotThunk,
  bulkAdjustWarehouseInventoryLotsQtyThunk, BulkLotAdjustmentPayload,
  LotAdjustmentSinglePayload,
  resetLotAdjustmentState,
  selectLotAdjustmentQtyErrorBulk,
  selectLotAdjustmentQtyErrorSingle,
  selectLotAdjustmentQtyLoadingBulk,
  selectLotAdjustmentQtyLoadingSingle,
  selectLotAdjustmentQtySuccessBulk,
  selectLotAdjustmentQtySuccessSingle,
} from '../features/warehouse-inventory';

const useLotAdjustmentQty = (refreshInventoryCallback?: () => void) => {
  const dispatch = useAppDispatch();
  
  // Single Lot Adjustment State
  const loadingSingle = useAppSelector(selectLotAdjustmentQtyLoadingSingle);
  const successSingle = useAppSelector(selectLotAdjustmentQtySuccessSingle);
  const errorSingle = useAppSelector(selectLotAdjustmentQtyErrorSingle);
  
  // Bulk Lot Adjustment State
  const loadingBulk = useAppSelector(selectLotAdjustmentQtyLoadingBulk);
  const successBulk = useAppSelector(selectLotAdjustmentQtySuccessBulk);
  const errorBulk = useAppSelector(selectLotAdjustmentQtyErrorBulk);
  
  /**
   * Handles a single lot adjustment and refreshes the inventory after update.
   */
  const handleSingleLotAdjustment = async (
    warehouseInventoryLotId: string,
    adjustedQuantity: number,
    adjustmentTypeId: string,
    comments: string
  ) => {
    try {
      const payload: LotAdjustmentSinglePayload = {
        adjustment_type_id: adjustmentTypeId,
        adjusted_quantity: adjustedQuantity,
        comments,
      };
      
      await dispatch(adjustWarehouseInventoryLotThunk({ warehouseInventoryLotId, payload })).unwrap();
      
      // Refresh inventory after successful update (if callback exists)
      if (refreshInventoryCallback) {
        refreshInventoryCallback();
      }
    } catch (error) {
      console.error('Failed to adjust warehouse inventory lot:', error);
    }
  };
  
  /**
   * Handles bulk lot adjustments
   */
  const handleBulkLotAdjustment = async (bulkData: BulkLotAdjustmentPayload) => {
    console.log("🔹 Bulk Data Received:", bulkData);
    
    try {
      await dispatch(bulkAdjustWarehouseInventoryLotsQtyThunk(bulkData));
      if (refreshInventoryCallback) {
        refreshInventoryCallback();
      }
    } catch (error) {
      console.error("Bulk adjustment failed:", error);
      throw error;
    }
  };
  
  /**
   * Resets the adjustment state.
   */
  const resetAdjustmentState = () => {
    dispatch(resetLotAdjustmentState());
  };
  
  return {
    loadingSingle, successSingle, errorSingle,
    loadingBulk, successBulk, errorBulk,
    handleSingleLotAdjustment,
    handleBulkLotAdjustment,
    resetAdjustmentState
  };
};

export default useLotAdjustmentQty;
