import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CustomDialog from '@components/common/CustomDialog';
import type { CustomerCreateMode } from '@features/customer/state';
import CustomerCreateToggle from '@features/customer/components/CustomerCreateToggle';
import useCustomerCreate from '@hooks/useCustomerCreate';
import SingleCustomerForm from './SingleCustomerForm';
import BulkCustomerForm from './BulkCustomerForm';

interface CustomerCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

const CustomerCreateDialog = ({ open, onClose }: CustomerCreateDialogProps) => {
  const [mode, setMode] = useState<CustomerCreateMode>('single');
  
  const {
    createCustomers,
    loading,
    error,
    resetCustomerCreate,
  } = useCustomerCreate();
  
  const handleClose = () => {
    resetCustomerCreate();
    setMode('single'); // reset mode
    onClose();
  };
  
  const handleSubmit = useCallback(async (data: any) => {
    const payload = mode === 'single' ? [data] : data;
    await createCustomers(payload);
  }, [mode, createCustomers]);
  
  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      title="Add Customer"
      showCancelButton={!loading}
      disableCloseOnBackdrop={loading}
      disableCloseOnEscape={loading}
    >
      <CustomerCreateToggle value={mode} onChange={setMode} />
      
      <Box sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {mode === 'single' ? (
          <SingleCustomerForm loading={loading} onSubmit={handleSubmit} />
        ) : (
          <BulkCustomerForm loading={loading} onSubmit={handleSubmit} />
        )}
      </Box>
    </CustomDialog>
  );
};

export default CustomerCreateDialog;
