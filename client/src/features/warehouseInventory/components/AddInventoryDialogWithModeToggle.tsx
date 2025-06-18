import {
  type Dispatch,
  type FC,
  type SetStateAction,
  type SyntheticEvent,
  useState,
} from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CustomDialog from '@components/common/CustomDialog';
import AddInventoryForm from '@features/warehouseInventory/components/AddInventoryForm';
import Alert from '@mui/material/Alert';
import type {
  BatchLookupOption,
  GetBatchRegistryLookupParams,
  GetWarehouseLookupFilters,
} from '@features/lookup/state';
import AddBulkInventoryForm from '@features/warehouseInventory/components/AddBulkInventoryForm';
import InventorySuccessDialog from '@features/inventoryShared/components/InventorySuccessDialog';
import type { InventoryRecordOutput } from '@features/inventoryShared/types/InventorySharedType';

interface AddInventoryDialogWithModeToggleProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  submitting: boolean;
  successOpen: boolean;
  successMessage?: string;
  onSuccessClose: () => void;
  warehouse?: InventoryRecordOutput | InventoryRecordOutput[];
  location?: InventoryRecordOutput | InventoryRecordOutput[];
  createError?: string | null;
  batchLookupOptions: BatchLookupOption[];
  selectedBatch: { id: string; type: string } | null;
  setSelectedBatch: (batch: { id: string; type: string } | null) => void;
  batchLookupParams: GetBatchRegistryLookupParams;
  setBatchLookupParams: Dispatch<
    SetStateAction<GetBatchRegistryLookupParams>
  >;
  fetchBatchLookup: (params: GetBatchRegistryLookupParams) => void;
  hasMore: boolean;
  pagination: { limit: number; offset: number };
  batchLookupLoading?: boolean;
  batchLookupError?: string | null;
  warehouseLookupOptions: { value: string; label: string }[];
  selectedWarehouse: { warehouseId: string; locationId: string } | null;
  setSelectedWarehouse: (
    w: { warehouseId: string; locationId: string } | null
  ) => void;
  fetchWarehouseLookup: (params: GetWarehouseLookupFilters) => void;
  warehouseLookupLoading?: boolean;
  warehouseLookupError?: string | null;
}

const AddInventoryDialogWithModeToggle: FC<
  AddInventoryDialogWithModeToggleProps
> = ({
  open,
  onClose,
  onSubmit,
  submitting,
  successOpen,
  onSuccessClose,
  successMessage = 'Inventory submitted successfully.',
  warehouse,
  location,
  createError,
  batchLookupOptions,
  selectedBatch,
  setSelectedBatch,
  batchLookupParams,
  setBatchLookupParams,
  fetchBatchLookup,
  hasMore,
  pagination,
  batchLookupLoading,
  batchLookupError,
  warehouseLookupOptions,
  selectedWarehouse,
  setSelectedWarehouse,
  fetchWarehouseLookup,
  warehouseLookupLoading,
  warehouseLookupError,
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  const handleModeChange = (_: SyntheticEvent, newValue: 'single' | 'bulk') => {
    if (submitting || newValue === null) return;
    setMode(newValue);
    setSelectedBatch(null);
  };
  
  return (
    <>
      {successOpen ? (
        <InventorySuccessDialog
          open={successOpen}
          onClose={onSuccessClose}
          message={successMessage ?? 'Inventory created successfully.'}
          warehouse={warehouse}
          location={location}
        />
      ) : (
        <CustomDialog
          open={open}
          onClose={onClose}
          title="Add Inventory"
          showCancelButton={!submitting}
          disableCloseOnBackdrop={submitting}
          disableCloseOnEscape={submitting}
        >
          <Tabs value={mode} onChange={handleModeChange} sx={{ mb: 2 }}>
            <Tab label="Single Entry" value="single" />
            <Tab label="Bulk Entry" value="bulk" />
          </Tabs>
          
          <Box sx={{ mt: 2, px: 2 }}>
          {createError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createError}
              </Alert>
            )}
            
            {mode === 'single' ? (
              <AddInventoryForm
                onSubmit={onSubmit}
                loading={submitting}
                batchLookupOptions={batchLookupOptions}
                selectedBatch={selectedBatch}
                setSelectedBatch={setSelectedBatch}
                batchLookupParams={batchLookupParams}
                setBatchLookupParams={setBatchLookupParams}
                fetchBatchLookup={fetchBatchLookup}
                hasMore={hasMore}
                pagination={pagination}
                batchLookupLoading={batchLookupLoading}
                batchLookupError={batchLookupError}
                warehouseLookupOptions={warehouseLookupOptions}
                selectedWarehouse={selectedWarehouse}
                setSelectedWarehouse={setSelectedWarehouse}
                fetchWarehouseLookup={fetchWarehouseLookup}
                warehouseLookupLoading={warehouseLookupLoading}
                warehouseLookupError={warehouseLookupError}
              />
            ) : (
              <AddBulkInventoryForm
                onSubmit={onSubmit}
                loading={submitting}
                batchLookupOptions={batchLookupOptions}
                batchLookupParams={batchLookupParams}
                setBatchLookupParams={setBatchLookupParams}
                fetchBatchLookup={fetchBatchLookup}
                hasMore={hasMore}
                pagination={pagination}
                batchLookupLoading={batchLookupLoading}
                batchLookupError={batchLookupError}
                warehouseLookupOptions={warehouseLookupOptions}
                selectedWarehouse={selectedWarehouse}
                setSelectedWarehouse={setSelectedWarehouse}
                fetchWarehouseLookup={fetchWarehouseLookup}
                warehouseLookupLoading={warehouseLookupLoading}
                warehouseLookupError={warehouseLookupError}
              />
            )}
          </Box>
        </CustomDialog>
      )}
    </>
  );
};

export default AddInventoryDialogWithModeToggle;
