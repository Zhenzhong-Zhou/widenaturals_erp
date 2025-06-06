import { type FC, useEffect, useMemo, useState } from 'react';
import AddInventoryDialogWithModeToggle from '@features/warehouseInventory/components/AddInventoryDialogWithModeToggle.tsx';
import useCreateWarehouseInventory from '@hooks/useCreateWarehouseInventory.ts';
import type {
  BatchRegistryDropdownItem,
  GetBatchRegistryDropdownParams,
  WarehouseDropdownItem,
  WarehouseOption,
} from '@features/dropdown/state';
import { formatDate } from '@utils/dateTimeUtils.ts';
import useBatchRegistryDropdown from '@hooks/useBatchRegistryDropdown.ts';
import type {
  CreateInventoryRecordsRequest,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';
import useWarehouseDropdown from '@hooks/useWarehouseDropdown.ts';

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
  const [batchDropdownParams, setBatchDropdownParams] =
    useState<GetBatchRegistryDropdownParams>({
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
    fetchDropdown: fetchWarehouseDropdown,
  } = useWarehouseDropdown();

  const {
    items: batchOptions,
    loading: batchLoading,
    error: batchError,
    hasMore,
    pagination,
    fetchDropdown: fetchBatchRegistryDropdown,
    resetDropdown: restBatchRegistryDropdown,
  } = useBatchRegistryDropdown();

  useEffect(() => {
    fetchWarehouseDropdown();
  }, [fetchWarehouseDropdown]);

  useEffect(() => {
    fetchBatchRegistryDropdown({ ...batchDropdownParams, offset: 0 }); // initial load
    return () => {
      restBatchRegistryDropdown();
    };
  }, [
    fetchBatchRegistryDropdown,
    restBatchRegistryDropdown,
    batchDropdownParams,
  ]);

  const transformWarehouseDropdownToOptions = (
    items: WarehouseDropdownItem[]
  ): WarehouseOption[] => {
    return items.map((item) => ({
      label: item.label,
      value: `${item.value}::${item.metadata.locationId}`,
    }));
  };

  const warehouseDropdownOptions = useMemo(() => {
    return transformWarehouseDropdownToOptions(warehouseOptions);
  }, [warehouseOptions]);

  const batchDropdownOptions = useMemo(() => {
    const seenValues = new Set<string>();

    return batchOptions.reduce(
      (
        acc: { value: string; label: string }[],
        item: BatchRegistryDropdownItem
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
      batchDropdownOptions={batchDropdownOptions}
      selectedBatch={selectedBatch}
      setSelectedBatch={setSelectedBatch}
      batchDropdownParams={batchDropdownParams}
      setBatchDropdownParams={setBatchDropdownParams}
      fetchBatchDropdown={fetchBatchRegistryDropdown}
      hasMore={hasMore}
      pagination={pagination}
      batchDropdownLoading={batchLoading}
      batchDropdownError={batchError}
      warehouseDropdownOptions={warehouseDropdownOptions}
      selectedWarehouse={selectedWarehouse}
      setSelectedWarehouse={setSelectedWarehouse}
      fetchWarehouseDropdown={fetchWarehouseDropdown}
      warehouseDropdownLoading={warehouseLoading}
      warehouseDropdownError={warehouseError}
    />
  );
};

export default AddInventoryDialog;
