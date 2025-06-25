import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CustomDialog from '@components/common/CustomDialog';
import type { CustomerCreateMode } from '@features/customer/state';
import CustomerCreateToggle from '@features/customer/components/CustomerCreateToggle';
import useCustomerCreate from '@hooks/useCustomerCreate';
import SingleCustomerForm from './SingleCustomerForm';
import BulkCustomerForm from './BulkCustomerForm';
import CustomerSuccessDialog from '@features/customer/components/CustomerSuccessDialog';

interface CustomerCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

const CustomerCreateDialog = ({ open, onClose }: CustomerCreateDialogProps) => {
  const [mode, setMode] = useState<CustomerCreateMode>('single');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const {
    loading,
    error,
    customerCreateResponse,
    // customerNames,
    createCustomers,
    resetCustomerCreate,
  } = useCustomerCreate();
  
  useEffect(() => {
    if (customerCreateResponse?.success) {
      setShowSuccessDialog(true);
    }
  }, [customerCreateResponse]);
  
  const handleClose = () => {
    resetCustomerCreate();
    setMode('single'); // reset mode
    onClose();
  };
  
  const handleSubmit = useCallback(async (data: any) => {
    const dataArray = mode === 'single' ? [data] : data;
    
    // Strip `id` field from each item before submission
    const payload = dataArray.map((item: Record<string, any>) => {
      const { id, ...rest } = item;
      return rest;
    });
    
    await createCustomers(payload);
  }, [mode, createCustomers]);
  
  return (
    <>
      {showSuccessDialog? (
        <CustomerSuccessDialog
          open={showSuccessDialog}
          onClose={() => {
            setShowSuccessDialog(false);
            handleClose();
          }}
          message={customerCreateResponse?.message}
          customers={customerCreateResponse?.data}
        />
      ) : (
        <CustomDialog
          open={open}
          onClose={handleClose}
          title="Add Customer"
          showCancelButton={!loading}
          disableCloseOnBackdrop={loading}
          disableCloseOnEscape={loading}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ px: 2, py: 1 }} >
            <CustomerCreateToggle value={mode} onChange={setMode} />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ mt: 2 }}>
              {mode === 'single' ? (
                <SingleCustomerForm loading={loading} onSubmit={handleSubmit} />
              ) : (
                <BulkCustomerForm loading={loading} onSubmit={handleSubmit} />
              )}
            </Box>
          </Box>
        </CustomDialog>
      )}
    </>
  );
};

export default CustomerCreateDialog;
