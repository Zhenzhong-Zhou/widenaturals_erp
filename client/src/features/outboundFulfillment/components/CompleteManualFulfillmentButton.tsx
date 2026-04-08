import { type FC, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import CustomButton from '@components/common/CustomButton';
import useCompleteManualFulfillment from '@hooks/useCompleteManualFulfillment';

interface CompleteManualFulfillmentButtonProps {
  /** The ID of the shipment being manually fulfilled */
  shipmentId: string;

  /** Callback to refresh data after successful manual fulfillment */
  refresh: () => void;
}

const CompleteManualFulfillmentButton: FC<
  CompleteManualFulfillmentButtonProps
> = ({ shipmentId, refresh }) => {
  const {
    loading,
    error,
    data,
    submitManualFulfillment,
    resetManualFulfillment,
  } = useCompleteManualFulfillment();

  /**
   * Handles the manual fulfillment submission.
   */
  const handleComplete = useCallback(async () => {
    try {
      await submitManualFulfillment({
        shipmentId,
        body: {
          orderStatus: 'ORDER_DELIVERED',
          shipmentStatus: 'SHIPMENT_COMPLETED',
          fulfillmentStatus: 'FULFILLMENT_COMPLETED',
        },
      });
    } catch (err) {
    }
  }, [shipmentId, submitManualFulfillment]);

  /**
   * React to success or failure, then reset.
   */
  useEffect(() => {
    if (data) {
      alert('Manual fulfillment completed successfully.');
      refresh();
      resetManualFulfillment();
    }
  }, [data, error, refresh, resetManualFulfillment]);
  
  useEffect(() => {
    if (error) {
      resetManualFulfillment();
    }
  }, [error, resetManualFulfillment]);
  
  return (
    <Box>
      <CustomButton
        variant="contained"
        color="primary"
        loading={loading}
        disabled={loading}
        onClick={handleComplete}
      >
        {loading ? 'Completing...' : 'Complete Fulfillment'}
      </CustomButton>
    </Box>
  );
};

export default CompleteManualFulfillmentButton;
