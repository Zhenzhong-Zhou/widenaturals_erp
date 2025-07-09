import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CreateMode } from '@shared-types/shared';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CustomDialog from '@components/common/CustomDialog';
import useAddressCreation from '@hooks/useAddressCreation';
import useCustomerLookup from '@hooks/useCustomerLookup';
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
    loading: isCreatingAddress,
    error: creationError,
    data: createdAddresses,
    success: creationSuccess,
    message: creationMessage,
    createAddresses,
    resetAddressesCreation,
  } = useAddressCreation();
  
  const {
    loading: customerLookupLoading,
    error: customerLookupError,
    options: customerDropdownOptions,
    meta: customerLookupPaginationMeta,
    fetchLookup: fetchCustomerDropdownOptions,
  } = useCustomerLookup();
  
  useEffect(() => {
    if (creationSuccess) {
      setShowSuccessDialog(true);
    }
  }, [creationSuccess]);
  
  const deduplicatedOptions = useMemo(() => {
    return Array.from(
      new Map(customerDropdownOptions.map((opt) => [opt.value, opt])).values()
    );
  }, [customerDropdownOptions]);
  
  // todo: refresh
  const handleClose = () => {
    resetAddressesCreation();
    setMode('single');
    onClose();
  };
  
  const handleSubmit = useCallback(
    async (data: any) => {
      const dataArray = mode === 'single' ? [data] : data;
      
      // If customerIds are provided, override customer_id in payload
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
      
      const payload = dataArray.map((item: Record<string, any>, idx: number) => {
        const { id, ...rest } = item;
        
        return {
          ...rest,
          customer_id: customerIds?.length === 1
            ? customerIds[0]
            : customerIds?.[idx] ?? rest.customer_id, // fallback to form-provided customer_id
        };
      });
      
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
          message={creationMessage}
          addresses={createdAddresses}
        />
      ) : (
        <CustomDialog
          open={open}
          onClose={handleClose}
          title="Add Address"
          showCancelButton={!isCreatingAddress}
          disableCloseOnBackdrop={isCreatingAddress}
          disableCloseOnEscape={isCreatingAddress}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ px: 2, py: 1 }}>
            <CreateModeToggle
              value={mode}
              onChange={setMode}
              label="Address Entry Mode"
            />
            {creationError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {creationError}
              </Alert>
            )}
            <Box sx={{ mt: 2 }}>
              {mode === 'single' ? (
                <SingleAddressForm
                  loading={isCreatingAddress}
                  onSubmit={handleSubmit}
                  customerNames={customerNames}
                  customerIds={customerIds}
                  customerDropdownOptions={deduplicatedOptions}
                  fetchCustomerDropdownOptions={fetchCustomerDropdownOptions}
                  customerLookupLoading={customerLookupLoading}
                  customerLookupError={customerLookupError}
                  customerLookupMeta={customerLookupPaginationMeta}
                />
              ) : (
                <BulkAddressForm
                loading={isCreatingAddress}
                defaultValues={
                  customerIds?.length
                    ? customerIds.map((id) => ({ customer_id: id }))
                    : [{}]
                }
                onSubmit={handleSubmit}
                customerNames={customerNames}
                customerIds={customerIds}
                customerDropdownOptions={deduplicatedOptions}
                fetchCustomerDropdownOptions={fetchCustomerDropdownOptions}
                customerLookupLoading={customerLookupLoading}
                customerLookupError={customerLookupError}
                customerLookupMeta={customerLookupPaginationMeta}
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
