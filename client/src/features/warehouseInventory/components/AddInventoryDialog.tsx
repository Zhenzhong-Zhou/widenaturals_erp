import { type FC, useEffect, useMemo, useState } from 'react';
import AddInventoryDialogWithModeToggle from '@features/warehouseInventory/components/AddInventoryDialogWithModeToggle.tsx';
import useCreateWarehouseInventory from '@hooks/useCreateWarehouseInventory.ts';
import type {
  BatchRegistryLookupItem,
  GetBatchRegistryLookupParams,
  WarehouseLookupItem,
  WarehouseOption,
} from '@features/lookup/state';
import { formatDate } from '@utils/dateTimeUtils.ts';
import useBatchRegistryLookup from '@hooks/useBatchRegistryLookup';
import type {
  CreateInventoryRecordsRequest,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';
import useWarehouseLookup from '@hooks/useWarehouseLookup';

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
    hasMore,
    pagination,
    fetchLookup: fetchBatchRegistryLookup,
    resetLookup: restBatchRegistryLookup,
  } = useBatchRegistryLookup();

  useEffect(() => {
    fetchWarehouseLookup();
  }, [fetchWarehouseLookup]);

  useEffect(() => {
    fetchBatchRegistryLookup({ ...batchLookupParams, offset: 0 }); // initial load
  }, [
    fetchBatchRegistryLookup,
    batchLookupParams,
  ]);
  
  useEffect(() => {
    return () => {
      restBatchRegistryLookup(); // reset only on unmounting
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

  const batchLookupOptions = useMemo(() => {
    const seenValues = new Set<string>();

    return batchOptions.reduce(
      (
        acc: { value: string; label: string }[],
        item: BatchRegistryLookupItem
      ) => {
        const optionValue = `${item.id}::${item.type}`;

        if (seenValues.has(optionValue)) {
          console.warn(`Duplicate detected: ${optionValue}`);
          return acc; // Skip duplicate
        }

        seenValues.add(optionValue);

        if (item.type === 'product') {
          const name = item.product?.name ?? 'Unknown Product';
          const lot = item.product?.lotNumber ?? 'N/A';
          const exp = formatDate(item.product?.expiryDate);
          acc.push({
            value: optionValue,
            label: `${name} - ${lot} (Exp: ${exp})`,
          });
        } else if (item.type === 'packaging_material') {
          const name =
            item.packagingMaterial?.snapshotName ?? 'Unknown Material';
          const lot = item.packagingMaterial?.lotNumber ?? 'N/A';
          const exp = formatDate(item.packagingMaterial?.expiryDate);
          acc.push({
            value: optionValue,
            label: `${name} - ${lot} (Exp: ${exp})`,
          });
        } else {
          acc.push({
            value: optionValue,
            label: 'Unknown Type',
          });
        }

        return acc;
      },
      [] // initial value
    );
  }, [batchOptions]);

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
      hasMore={hasMore}
      pagination={pagination}
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
