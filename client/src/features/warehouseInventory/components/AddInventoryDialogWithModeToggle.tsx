import { type Dispatch, type FC, type SetStateAction, type SyntheticEvent, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CustomDialog from '@components/common/CustomDialog';
import AddInventoryForm from '@features/warehouseInventory/components/AddInventoryForm';
import Alert from '@mui/material/Alert';
import type { GetBatchRegistryDropdownParams, GetWarehouseDropdownFilters } from '@features/dropdown/state';
import AddBulkInventoryForm from '@features/warehouseInventory/components/AddBulkInventoryForm';

interface AddInventoryDialogWithModeToggleProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  submitting: boolean;
  createError?: string | null;
  batchDropdownOptions: { value: string; label: string }[];
  selectedBatch: { id: string; type: string } | null;
  setSelectedBatch: (batch: { id: string; type: string } | null) => void;
  batchDropdownParams: GetBatchRegistryDropdownParams;
  setBatchDropdownParams: Dispatch<SetStateAction<GetBatchRegistryDropdownParams>>;
  fetchBatchDropdown: (params: GetBatchRegistryDropdownParams) => void;
  hasMore: boolean;
  pagination: { limit: number; offset: number };
  batchDropdownLoading?: boolean;
  batchDropdownError?: string | null;
  warehouseDropdownOptions: { value: string; label: string }[];
  selectedWarehouse: { warehouseId: string; locationId: string } | null;
  setSelectedWarehouse: (w: { warehouseId: string; locationId: string } | null) => void;
  fetchWarehouseDropdown: (params: GetWarehouseDropdownFilters) => void;
  warehouseDropdownLoading?: boolean;
  warehouseDropdownError?: string | null;
}

const AddInventoryDialogWithModeToggle: FC<AddInventoryDialogWithModeToggleProps> = ({
                                                                                       open,
                                                                                       onClose,
                                                                                       onSubmit,
                                                                                       submitting,
                                                                                       createError,
                                                                                       batchDropdownOptions,
                                                                                       selectedBatch,
                                                                                       setSelectedBatch,
                                                                                       batchDropdownParams,
                                                                                       setBatchDropdownParams,
                                                                                       fetchBatchDropdown,
                                                                                       hasMore,
                                                                                       pagination,
                                                                                       batchDropdownLoading,
                                                                                       batchDropdownError,
                                                                                       warehouseDropdownOptions,
                                                                                       selectedWarehouse,
                                                                                       setSelectedWarehouse,
                                                                                       fetchWarehouseDropdown,
                                                                                       warehouseDropdownLoading,
                                                                                       warehouseDropdownError,
                                                                                     }) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  const handleModeChange = (_: SyntheticEvent, newValue: 'single' | 'bulk') => {
    if (submitting || newValue === null) return;
    setMode(newValue);
    setSelectedBatch(null);
  };
  
  return (
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
      
      <Box sx={{ mt: 2 }}>
        {createError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {createError}
          </Alert>
        )}
        
        {mode === 'single' ? (
          <AddInventoryForm
            onSubmit={onSubmit}
            loading={submitting}
            batchDropdownOptions={batchDropdownOptions}
            selectedBatch={selectedBatch}
            setSelectedBatch={setSelectedBatch}
            batchDropdownParams={batchDropdownParams}
            setBatchDropdownParams={setBatchDropdownParams}
            fetchBatchDropdown={fetchBatchDropdown}
            hasMore={hasMore}
            pagination={pagination}
            batchDropdownLoading={batchDropdownLoading}
            batchDropdownError={batchDropdownError}
            warehouseDropdownOptions={warehouseDropdownOptions}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
            fetchWarehouseDropdown={fetchWarehouseDropdown}
            warehouseDropdownLoading={warehouseDropdownLoading}
            warehouseDropdownError={warehouseDropdownError}
          />
        ) : (
          <AddBulkInventoryForm
            onSubmit={onSubmit}
            loading={submitting}
            batchDropdownOptions={batchDropdownOptions}
            selectedBatch={selectedBatch}
            setSelectedBatch={setSelectedBatch}
            batchDropdownParams={batchDropdownParams}
            setBatchDropdownParams={setBatchDropdownParams}
            fetchBatchDropdown={fetchBatchDropdown}
            hasMore={hasMore}
            pagination={pagination}
            batchDropdownLoading={batchDropdownLoading}
            batchDropdownError={batchDropdownError}
            warehouseDropdownOptions={warehouseDropdownOptions}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
            fetchWarehouseDropdown={fetchWarehouseDropdown}
            warehouseDropdownLoading={warehouseDropdownLoading}
            warehouseDropdownError={warehouseDropdownError}
          />
        )}
      </Box>
    </CustomDialog>
  );
};

export default AddInventoryDialogWithModeToggle;
