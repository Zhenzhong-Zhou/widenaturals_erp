import { type FC, useEffect, useMemo, useState } from 'react';
import AddInventoryDialogWithModeToggle from '@features/warehouseInventory/components/AddInventoryDialogWithModeToggle.tsx';
import useCreateWarehouseInventory from '@hooks/useCreateWarehouseInventory.ts';
import type {
  GetBatchRegistryLookupParams,
  WarehouseLookupItem,
  WarehouseOption,
} from '@features/lookup/state';
import useBatchRegistryLookup from '@hooks/useBatchRegistryLookup';
import type {
  CreateInventoryRecordsRequest,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';
import useWarehouseLookup from '@hooks/useWarehouseLookup';
import { mapBatchLookupToOptions } from '@features/lookup/utils/batchRegistryUtils.ts';

interface AddInventoryDialogProps {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
}

const AddInventoryDialog: FC<AddInventoryDialogProps> = ({
  open,
  onClose,
  onExited,
}) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<{
    locationId: string;
    warehouseId: string;
  } | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<{
    id: string;
    type: string;
  } | null>(null);
  const [batchLookupParams, setBatchLookupParams] =
    useState<GetBatchRegistryLookupParams>({
      batchType: '',
      warehouseId: '',
      locationId: '',
      limit: 50,
      offset: 0,
    });
  const [submitting, setSubmitting] = useState(false);

  const {
    createInventory,
    loading: isCreating,
    success: isCreateSuccess,
    error: createError,
    message: createMessage,
    warehouse,
    location,
    resetState,
  } = useCreateWarehouseInventory();
  
  const {
    items: warehouseOptions,
    loading: warehouseLoading,
    error: warehouseError,
    fetchLookup: fetchWarehouseLookup,
  } = useWarehouseLookup();

  const {
    items: batchOptions,
    loading: batchLoading,
    error: batchError,
    meta: batchLookupPaginationMeta,
    fetchLookup: fetchBatchRegistryLookup,
    resetLookup: restBatchRegistryLookup,
  } = useBatchRegistryLookup();
  
  useEffect(() => {
    if (open) {
      fetchWarehouseLookup();
    }
  }, [open, fetchWarehouseLookup]);

  useEffect(() => {
    if (open && selectedWarehouse) {
      fetchBatchRegistryLookup({ ...batchLookupParams, offset: 0 });
    }
  }, [open, fetchBatchRegistryLookup, batchLookupParams]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      restBatchRegistryLookup();
    }
  }, [open, restBatchRegistryLookup]);

  // Also reset on unmounting (as fallback)
  useEffect(() => {
    return () => {
      restBatchRegistryLookup();
    };
  }, [restBatchRegistryLookup]);

  const transformWarehouseLookupToOptions = (
    items: WarehouseLookupItem[]
  ): WarehouseOption[] => {
    return items.map((item) => ({
      label: item.label,
      value: `${item.value}::${item.metadata.locationId}`,
    }));
  };

  const warehouseLookupOptions = useMemo(() => {
    return transformWarehouseLookupToOptions(warehouseOptions);
  }, [warehouseOptions]);
  
  const batchLookupOptions = useMemo(
    () => mapBatchLookupToOptions(batchOptions, true),
    [batchOptions]
  );

  useEffect(() => {
    if (!open) {
      setSelectedBatch(null);
      resetState();
      setSubmitting(false);
    }
  }, [open]);

  const handleFormSubmit = (
    formData: CreateInventoryRecordsRequest
  ) => {
    try {
      setSubmitting(true);

      const items = Array.isArray(formData) ? formData : [formData];

      const transformedRecords = items.map((item) => {
        const [warehouse_id = '', location_id = ''] = (
          item.warehouse_id ?? ''
        ).split('::');
        const [rawBatchId, rawBatchType] = (item.batch_id ?? '').split('::');

        const batch_id = rawBatchId || '';
        const batch_type: ItemType =
          rawBatchType === 'product' ? 'product' : 'packaging_material';

        return {
          warehouse_id,
          location_id,
          batch_id,
          batch_type,
          quantity: Number(item.quantity),
          inbound_date: item.inbound_date?.split('T')[0] ?? '',
          comments: item.comments ?? '',
        };
      });

      createInventory({ records: transformedRecords });
    } catch (err) {
      console.error('Insert failed:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSuccessDialogClose = () => {
    setSelectedBatch(null);
    onClose();     // close the main dialog
    resetState();
    if (typeof onExited === 'function') {
      onExited();
    }
  };

  return (
    <AddInventoryDialogWithModeToggle
      open={open}
      onClose={onClose}
      onSubmit={handleFormSubmit}
      submitting={submitting || isCreating}
      successOpen={isCreateSuccess}
      successMessage={createMessage}
      onSuccessClose={handleSuccessDialogClose}
      warehouse={warehouse}
      location={location}
      createError={createError}
      batchLookupOptions={batchLookupOptions}
      selectedBatch={selectedBatch}
      setSelectedBatch={setSelectedBatch}
      batchLookupParams={batchLookupParams}
      setBatchLookupParams={setBatchLookupParams}
      fetchBatchLookup={fetchBatchRegistryLookup}
      resetBatchLookup={restBatchRegistryLookup}
      lookupPaginationMeta={batchLookupPaginationMeta}
      batchLookupLoading={batchLoading}
      batchLookupError={batchError}
      warehouseLookupOptions={warehouseLookupOptions}
      selectedWarehouse={selectedWarehouse}
      setSelectedWarehouse={setSelectedWarehouse}
      fetchWarehouseLookup={fetchWarehouseLookup}
      warehouseLookupLoading={warehouseLoading}
      warehouseLookupError={warehouseError}
    />
  );
};

export default AddInventoryDialog;
