import { type FC } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import { InitiateFulfillmentForm } from '@features/outboundFulfillment/components/InitiateFulfillmentFormModal';
import type { InitiateFulfillmentBody } from '@features/outboundFulfillment/state';
import { useModalFocusHandlers } from '@utils/hooks/useModalFocusHandlers';

interface InitiateFulfillmentModalProps {
  orderId: string;
  allocationIds: string[];
  defaultValues?: Partial<InitiateFulfillmentBody>;
  onSuccess?: () => void;
  buttonLabel?: string;
  buttonVariant?: 'text' | 'outlined' | 'contained';
  buttonColor?: 'primary' | 'secondary' | 'info' | 'error';
}

/**
 * A dedicated modal wrapper for initiating outbound fulfillment.
 * Renders a trigger button, and on click opens a modal containing the
 * InitiateFulfillmentForm.
 */
const InitiateFulfillmentModal: FC<InitiateFulfillmentModalProps> = ({
  orderId,
  allocationIds,
  defaultValues,
  onSuccess,
  buttonLabel = 'Initiate Fulfillment',
  buttonVariant = 'contained',
  buttonColor = 'primary',
}) => {
  const { open, triggerRef, handleOpen, handleClose } = useModalFocusHandlers();

  return (
    <>
      <CustomButton
        ref={triggerRef}
        variant={buttonVariant}
        color={buttonColor}
        onClick={handleOpen}
      >
        {buttonLabel}
      </CustomButton>

      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
          }}
        >
          {/* Title */}
          <Box sx={{ p: 3 }}>
            <CustomTypography variant="h6" sx={{ fontWeight: 'bold' }}>
              Initiate Outbound Fulfillment
            </CustomTypography>
          </Box>
          <Divider />

          {/* Scrollable Content */}
          <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
            <InitiateFulfillmentForm
              orderId={orderId}
              allocationIds={allocationIds}
              defaultValues={defaultValues}
              onSuccess={() => {
                handleClose();
                onSuccess?.();
              }}
            />
          </Box>
          <Divider />

          {/* Footer Actions */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            sx={{ p: 3 }}
          >
            <CustomButton
              onClick={handleClose}
              variant="outlined"
              color="secondary"
            >
              Cancel
            </CustomButton>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default InitiateFulfillmentModal;
