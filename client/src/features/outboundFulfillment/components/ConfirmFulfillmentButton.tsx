import { type FC, useEffect, useCallback, useMemo } from 'react';
import useConfirmOutboundFulfillment from '@hooks/useConfirmOutboundFulfillment';
import Box from '@mui/material/Box';
import CustomButton from '@components/common/CustomButton';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

interface ConfirmFulfillmentButtonProps {
  /** ID of the order to confirm fulfillment for */
  orderId: string;
  /** Callback to refresh parent data after confirmation */
  refresh: () => void;
}

const ConfirmFulfillmentButton: FC<ConfirmFulfillmentButtonProps> = ({ orderId, refresh }) => {
  const {
    loading,
    error,
    isSuccess,
    lastConfirmedAt,
    submitConfirmation,
    resetConfirmation,
  } = useConfirmOutboundFulfillment();
  
  /**
   * Handles the confirmation submission flow.
   * Wrapped in useCallback to avoid re-creating on every render.
   */
  const handleConfirm = useCallback(async () => {
    try {
      await submitConfirmation({
        orderId,
        orderStatus: 'ORDER_FULFILLED',
        allocationStatus: 'ALLOC_FULFILLED',
        shipmentStatus: 'SHIPMENT_READY',
        fulfillmentStatus: 'FULFILLMENT_PACKED',
      });
    } catch (err) {
      console.error('Confirm fulfillment failed:', err);
    }
  }, [orderId, submitConfirmation]);
  
  /**
   * Effect to react to success and error states.
   * Resets state when unmounting or after completion.
   */
  useEffect(() => {
    if (isSuccess) {
      alert('Fulfillment confirmed successfully.');
      refresh();
      resetConfirmation();
    } else if (error) {
      console.error('Fulfillment confirmation error:', error);
      alert('Failed to confirm fulfillment.');
    }
  }, [isSuccess, error]);
  
  // Memoize a friendly display label
  const lastConfirmedLabel = useMemo(() => {
    if (!lastConfirmedAt) return null;
    const relative = formatDistanceToNow(new Date(lastConfirmedAt), { addSuffix: true });
    return `Last confirmed ${relative}`;
  }, [lastConfirmedAt]);
  
  return (
   <Box>
     <CustomButton
       variant="contained"
       color="primary"
       loading={loading}
       disabled={loading}
       onClick={handleConfirm}
     >
       {loading ? 'Confirming...' : 'Confirm Fulfillment'}
     </CustomButton>
     
     {lastConfirmedLabel && (
       <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>{lastConfirmedLabel}</small>
     )}
   </Box>
  );
};

export default ConfirmFulfillmentButton;
