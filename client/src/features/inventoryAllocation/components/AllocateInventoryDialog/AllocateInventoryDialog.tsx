import { type FC, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import ErrorMessage from '@components/common/ErrorMessage';
import { StrategyDropdown } from '@features/inventoryAllocation/components/AllocateInventoryDialog/index';
import WarehouseDropdown from '@features/lookup/components/WarehouseDropdown';
import CustomDialog from '@components/common/CustomDialog';
import type { CustomDialogProps } from '@components/common/CustomDialog';
import useWarehouseLookup from '@hooks/useWarehouseLookup';
import useAllocateInventory from '@hooks/useAllocateInventory';

export interface AllocateInventoryDialogProps
  extends Omit<CustomDialogProps, 'title'> {
  orderId: string;
  category: string;
}

const AllocateInventoryDialog: FC<AllocateInventoryDialogProps> = ({
  open,
  onClose,
  orderId,
  category,
}) => {
  const navigate = useNavigate();

  const [strategy, setStrategy] = useState<string>('fefo');
  const [warehouseId, setWarehouseId] = useState<string | undefined>();

  const {
    items: warehouseOptions,
    loading: isWarehouseLoading,
    error: warehouseError,
    fetchLookup: fetchWarehouseLookup,
  } = useWarehouseLookup();

  const {
    loading: isAllocating,
    error: allocationError,
    allocate: allocateInventory,
    reset: resetInventoryAllocation,
  } = useAllocateInventory();

  // Transform warehouse items into dropdown options
  const warehouseLookupOptions = warehouseOptions.map((wh) => ({
    value: wh.value,
    label: wh.label,
  }));

  // Fetch and reset on open
  useEffect(() => {
    if (open) {
      resetInventoryAllocation();
      fetchWarehouseLookup();
    }
  }, [open, fetchWarehouseLookup, resetInventoryAllocation]);

  // Auto-select first warehouse when loaded
  useEffect(() => {
    if (!warehouseId && warehouseLookupOptions.length > 0) {
      const defaultWarehouse = warehouseLookupOptions.find(
        (w) =>
          w.label ===
          'WIDE Naturals Inc. (Head Office Warehouse - distribution_center)'
      );

      if (defaultWarehouse) {
        setWarehouseId(defaultWarehouse.value);
      } else {
        setWarehouseId(warehouseLookupOptions[0]?.value); // fallback
      }
    }
  }, [warehouseLookupOptions, warehouseId]);

  const handleAutoAllocate = useCallback(async () => {
    if (!orderId || !category) {
      console.warn('Missing orderId or category');
      return;
    }

    if (!warehouseId || !strategy) {
      alert('Please select both strategy and warehouse before allocating.');
      return;
    }

    try {
      const result = await allocateInventory(
        { orderId },
        { strategy, warehouseId }
      ).unwrap();

      const { orderId: allocationOrderId, allocationIds } = result.data;

      alert('Inventory successfully allocated!');
      navigate(`/inventory-allocations/review/${allocationOrderId}`, {
        state: {
          warehouseIds: [warehouseId],
          allocationIds,
          category,
        },
      });
    } catch (err: any) {
      console.error('Allocation failed:', err);
      alert(
        typeof err === 'string'
          ? err
          : err?.message || 'Failed to allocate inventory. Please try again.'
      );
    }
  }, [
    orderId,
    category,
    strategy,
    warehouseId,
    allocateInventory,
    navigate,
    resetInventoryAllocation,
  ]);

  const handleManualAllocate = () => {
    navigate(`/inventory-allocations/manual/${orderId}`);
  };

  const canAllocate = !!strategy && !!warehouseId;

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Allocate Inventory"
      showCancelButton
      confirmButtonText={
        canAllocate ? (isAllocating ? 'Allocating...' : 'Allocate') : undefined
      }
      onConfirm={canAllocate ? handleAutoAllocate : undefined}
    >
      <CustomTypography variant="subtitle1" gutterBottom>
        Automatic Allocation
      </CustomTypography>

      {allocationError && <ErrorMessage message={allocationError} />}

      <Stack spacing={2} mb={3}>
        <StrategyDropdown value={strategy} onChange={setStrategy} />
        <WarehouseDropdown
          value={warehouseId ?? ''}
          onChange={setWarehouseId}
          warehouseLookupOptions={warehouseLookupOptions}
          warehouseLookupLoading={isWarehouseLoading}
          warehouseLookupError={warehouseError}
          onRefresh={fetchWarehouseLookup}
        />
      </Stack>

      <Divider />

      <CustomTypography variant="subtitle1" mt={3} gutterBottom>
        Manual Allocation
      </CustomTypography>

      <CustomButton variant="outlined" onClick={handleManualAllocate}>
        Go to Manual Allocation
      </CustomButton>
    </CustomDialog>
  );
};

export default AllocateInventoryDialog;
