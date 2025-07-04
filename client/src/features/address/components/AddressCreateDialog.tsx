import { useCallback, useEffect, useState } from 'react';
import type { CreateMode } from '@shared-types/shared';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CustomDialog from '@components/common/CustomDialog';
import useAddressCreation from '@hooks/useAddressCreation';
import CreateModeToggle from '@components/common/CreateModeToggle';
import SingleAddressForm from '@features/address/components/SingleAddressForm';
import AddressSuccessDialog from '@features/address/components/AddressSuccessDialog';
import BulkAddressForm from '@features/address/components/BulkAddressForm';

interface AddressCreateDialogProps {
  open: boolean;
  onClose: () => void;
  customerNames?: string[];
  customerIds?: string[];
}

const AddressCreateDialog = ({ open, onClose, customerNames, customerIds }: AddressCreateDialogProps) => {
  const [mode, setMode] = useState<CreateMode>('single');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const {
    loading,
    error,
    data,
    success,
    message,
    createAddresses,
    resetAddressesCreation,
  } = useAddressCreation();
  
  useEffect(() => {
    if (success) {
      setShowSuccessDialog(true);
    }
  }, [success]);
  
  const handleClose = () => {
    resetAddressesCreation();
    setMode('single');
    onClose();
  };
  
  const handleSubmit = useCallback(
    async (data: any) => {
      const dataArray = mode === 'single' ? [data] : data;
      
      // Validate customerIds if provided
      if (customerIds) {
        if (
          customerIds.length !== dataArray.length &&
          customerIds.length !== 1
        ) {
          throw new Error(
            'Customer IDs and address data mismatch. Ensure they align.'
          );
        }
      }
      
      const payload = dataArray.map(
        (item: Record<string, any>, idx: number) => {
          const { id, ...rest } = item;
          return {
            ...rest,
            // Add customer_id if provided, otherwise omit
            ...(customerIds && {
              customer_id:
                customerIds.length === 1
                  ? customerIds[0]
                  : customerIds[idx],
            }),
          };
        }
      );
      
      await createAddresses(payload);
    },
    [mode, createAddresses, customerIds]
  );
  
  return (
    <>
      {showSuccessDialog ? (
        <AddressSuccessDialog
          open={showSuccessDialog}
          onClose={() => {
            setShowSuccessDialog(false);
            handleClose();
          }}
          message={message}
          addresses={data}
        />
      ) : (
        <CustomDialog
          open={open}
          onClose={handleClose}
          title="Add Address"
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
              label="Address Entry Mode"
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ mt: 2 }}>
              {mode === 'single' ? (
                <SingleAddressForm
                  loading={loading}
                  onSubmit={handleSubmit}
                  customerNames={customerNames}
                />
              ) : (
                <BulkAddressForm
                loading={loading}
                onSubmit={handleSubmit}
                customerNames={customerNames}
                />
              )}
            </Box>
          </Box>
        </CustomDialog>
      )}
    </>
  );
};

export default AddressCreateDialog;
