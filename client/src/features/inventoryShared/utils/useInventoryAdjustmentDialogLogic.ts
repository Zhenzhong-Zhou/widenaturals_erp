import { useEffect, useMemo } from 'react';
import useAdjustWarehouseInventory from '@hooks/useAdjustWarehouseInventory.ts';
import useLotAdjustmentTypeLookup from '@hooks/useLotAdjustmentTypeLookup.ts';
import {
  mapInventoryRecordToAdjustData,
  mapInventoryRecordsToAdjustData,
} from '@features/inventoryShared/utils/adjustInventoryRecordMapper.ts';
import type {
  InventoryRecord,
  InventoryAdjustmentInput,
  InventoryAdjustmentFormData,
} from '@features/inventoryShared/types/InventorySharedType.ts';

type Mode = 'single' | 'bulk';

interface UseAdjustmentLogicParams {
  mode: Mode;
  records: InventoryRecord[]; // For 'single', array of 1 item
}

export const useInventoryAdjustmentDialogLogic = ({ mode, records }: UseAdjustmentLogicParams) => {
  const {
    warehouse,
    location,
    message,
    success,
    loading: isSubmitting,
    error: submitError,
    adjustInventory,
    resetState,
  } = useAdjustWarehouseInventory();
  
  const {
    options: lookupOptions,
    loading: isLookupLoading,
    error: lookupError,
    fetchLotAdjustmentTypeLookup,
  } = useLotAdjustmentTypeLookup();
  
  useEffect(() => {
    fetchLotAdjustmentTypeLookup();
  }, [fetchLotAdjustmentTypeLookup]);
  
  const mappedRecords = useMemo(() => {
    if (mode === 'single') {
      if (!records[0]) throw new Error('Missing inventory record for single mode');
      return [mapInventoryRecordToAdjustData(records[0])];
    }
    return mapInventoryRecordsToAdjustData(records);
  }, [mode, records]);
  
  const initialQuantities = useMemo(() =>
    mappedRecords.map((mapped) =>
      typeof mapped.warehouseQuantity === 'number'
        ? mapped.warehouseQuantity
        : mapped.locationQuantity ?? 0
    ), [mappedRecords]);
  
  const handleSubmit = (formDataArray: InventoryAdjustmentFormData[] | InventoryAdjustmentFormData) => {
    try {
      const inputArray = Array.isArray(formDataArray) ? formDataArray : [formDataArray];
      
      const updates: InventoryAdjustmentInput[] = inputArray.map((formData, index) => {
        const mapped = mappedRecords[index];
        if (!mapped) {
          throw new Error(`No corresponding inventory record found for form entry at index ${index}`);
        }
        
        const [adjustment_type_id, inventory_action_type_id] =
        formData.adjustment_type_id?.split('::') ?? [];
        
        if (!adjustment_type_id || !inventory_action_type_id) {
          throw new Error('Invalid adjustment type selection.');
        }
        
        return {
          warehouse_id: mapped.warehouseId,
          location_id: mapped.locationId,
          batch_id: mapped.batchId,
          batch_type: mapped.batchType,
          quantity: Number(formData.newQuantity),
          inventory_action_type_id,
          adjustment_type_id,
          comments: formData.note || '',
        };
      });
      
      adjustInventory({ updates });
    } catch (error) {
      console.error('Adjustment failed', error);
    }
  };
  
  return {
    warehouse,
    location,
    message,
    success,
    isSubmitting,
    submitError,
    lookupOptions,
    isLookupLoading,
    lookupError,
    fetchLotAdjustmentTypeLookup,
    mappedRecords,
    initialQuantities,
    handleSubmit,
    resetState,
  };
};
