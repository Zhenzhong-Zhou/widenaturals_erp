import { type Dispatch, type FC, type SetStateAction, type SyntheticEvent, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CustomDialog from '@components/common/CustomDialog';
import AddInventoryForm from '@features/warehouseInventory/components/AddInventoryForm';
import Alert from '@mui/material/Alert';
import type { GetBatchRegistryDropdownParams } from '@features/dropdown/state';
// import AddBulkInventoryForm from '@features/warehouseInventory/components/AddBulkInventoryForm';

interface AddInventoryDialogWithModeToggleProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  submitting: boolean;
  createError?: string | null;
  dropdownOptions: { value: string; label: string }[];
  selectedBatch: { id: string; type: string } | null;
  setSelectedBatch: (batch: { id: string; type: string } | null) => void;
  batchDropdownParams: GetBatchRegistryDropdownParams;
  setBatchDropdownParams: Dispatch<SetStateAction<GetBatchRegistryDropdownParams>>;
  fetchDropdown: (params: GetBatchRegistryDropdownParams) => void;
  hasMore: boolean;
  pagination: { limit: number; offset: number };
  dropdownLoading?: boolean;
  dropdownError?: string | null;
}

const AddInventoryDialogWithModeToggle: FC<AddInventoryDialogWithModeToggleProps> = ({
                                                                                       open,
                                                                                       onClose,
                                                                                       onSubmit,
                                                                                       submitting,
                                                                                       createError,
                                                                                       dropdownOptions,
                                                                                       selectedBatch,
                                                                                       setSelectedBatch,
                                                                                       batchDropdownParams,
                                                                                       setBatchDropdownParams,
                                                                                       fetchDropdown,
                                                                                       hasMore,
                                                                                       pagination,
                                                                                       dropdownLoading,
                                                                                       dropdownError,
                                                                                     }) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  const handleModeChange = (_: SyntheticEvent, newValue: 'single' | 'bulk') => {
    if (newValue !== null) setMode(newValue);
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
            dropdownOptions={dropdownOptions}
            selectedBatch={selectedBatch}
            setSelectedBatch={setSelectedBatch}
            batchDropdownParams={batchDropdownParams}
            setBatchDropdownParams={setBatchDropdownParams}
            fetchDropdown={fetchDropdown}
            hasMore={hasMore}
            pagination={pagination}
            dropdownLoading={dropdownLoading}
            dropdownError={dropdownError}
          />
        ) : (
          <></>
          // <AddBulkInventoryForm ... />
        )}
      </Box>
    </CustomDialog>
  );
};

export default AddInventoryDialogWithModeToggle;
