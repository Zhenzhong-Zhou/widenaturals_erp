import { useCallback, useEffect, useState } from 'react';
import type { CreateMode } from '@shared-types/shared';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CustomDialog from '@components/common/CustomDialog';
import type { CustomerResponse } from '@features/customer/state';
import CreateModeToggle from '@components/common/CreateModeToggle';
import useCustomerCreate from '@hooks/useCustomerCreate';
import SingleCustomerForm from './SingleCustomerForm';
import BulkCustomerForm from './BulkCustomerForm';
import CustomerSuccessDialog from '@features/customer/components/CustomerSuccessDialog';
import AddressCreateDialog from '@features/address/components/AddressCreateDialog';

interface CustomerCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CustomerCreateDialog = ({
  open,
  onClose,
  onCreated,
}: CustomerCreateDialogProps) => {
  const [mode, setMode] = useState<CreateMode>('single');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [addressStarted, setAddressStarted] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);

  const {
    loading,
    error,
    customerCreateResponse,
    customerNames,
    createCustomers,
    resetCustomerCreateState,
  } = useCustomerCreate();

  useEffect(() => {
    if (customerCreateResponse?.success) {
      setShowSuccessDialog(true);
    }
  }, [customerCreateResponse]);

  const handleClose = () => {
    resetCustomerCreateState();
    setMode('single');
    onClose();
  };

  const handleSubmit = useCallback(
    async (data: any) => {
      const dataArray = mode === 'single' ? [data] : data;
      const payload = dataArray.map((item: Record<string, any>) => {
        const { id, ...rest } = item;
        return rest;
      });
      await createCustomers(payload);
    },
    [mode, createCustomers]
  );

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    if (!addressStarted) {
      onCreated();
      handleClose();
    }
  };

  const handleAddressDialogClose = () => {
    setShowAddressDialog(false);
    setAddressStarted(false);
    onCreated();
    handleClose();
  };

  return (
    <>
      {showSuccessDialog ? (
        <CustomerSuccessDialog
          open={showSuccessDialog}
          onClose={handleSuccessDialogClose}
          message={customerCreateResponse?.message}
          customers={customerCreateResponse?.data}
          onAddAddressClick={() => {
            setShowSuccessDialog(false);
            setTimeout(() => {
              setShowAddressDialog(true);
            }, 50); // 50-100 ms is usually enough
          }}
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
          <Box sx={{ px: 2, py: 1 }}>
            <CreateModeToggle
              value={mode}
              onChange={setMode}
              label="Customer Entry Mode"
            />
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

      {/* Address creation dialog after customer creation */}
      {showAddressDialog && (
        <AddressCreateDialog
          open={showAddressDialog}
          onClose={handleAddressDialogClose}
          customerNames={customerNames}
          customerIds={
            customerCreateResponse?.data.map((c: CustomerResponse) => c.id) ??
            []
          }
        />
      )}
    </>
  );
};

export default CustomerCreateDialog;
