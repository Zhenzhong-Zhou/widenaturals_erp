import type { FC } from 'react';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { CustomButton, ErrorMessage } from '@components/index';
import {
  AllocationStatusSummary
} from '@features/inventoryAllocation/components/AllocationInventoryReviewDetails/index';
import {
  InitiateFulfillmentModal
} from '@features/outboundFulfillment/components/InitiateFulfillmentFormModal';

interface AllocationActionToolbarProps {
  confirmError?: string | null;
  canConfirm: boolean;
  handleConfirmationSubmit: () => void;
  isReviewLoading: boolean;
  isConfirming: boolean;
  
  allocationSummary: {
    total: number;
    confirmed: number;
    incomplete: number;
  };
  
  canInitiateFulfillment: boolean;
  orderId: string;
  allocationIds: string[];
  
  allocationReviewHeader?: {
    orderNumber?: string;
    salespersonName?: string;
  } | null;
  
  refresh: () => void;
}

const AllocationActionToolbar: FC<AllocationActionToolbarProps> = ({
                                   confirmError,
                                   canConfirm,
                                   handleConfirmationSubmit,
                                   isReviewLoading,
                                   isConfirming,
                                   allocationSummary,
                                   canInitiateFulfillment,
                                   orderId,
                                   allocationIds,
                                   allocationReviewHeader,
                                   refresh,
                                 }) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {confirmError && <ErrorMessage message={confirmError} />}
      
      <AllocationStatusSummary {...allocationSummary} />
      
      {canConfirm && (
        <CustomButton
          onClick={handleConfirmationSubmit}
          disabled={isReviewLoading || isConfirming}
        >
          {isReviewLoading || isConfirming ? 'Confirming' : 'Confirm Allocation'}
        </CustomButton>
      )}
      
      {orderId && allocationIds.length > 0 && (
        <Tooltip
          title={
            !canInitiateFulfillment
              ? `${allocationSummary.incomplete} items must be fully allocated before fulfillment`
              : ''
          }
        >
          <span>
            <InitiateFulfillmentModal
              disabled={!canInitiateFulfillment}
              orderId={orderId}
              allocationIds={allocationIds}
              defaultValues={{
                fulfillmentNotes: `Fulfillment initiated for Order ${
                  allocationReviewHeader?.orderNumber ?? ''
                }`,
              }}
              onSuccess={refresh}
            />
          </span>
        </Tooltip>
      )}
      
      <CustomButton
        onClick={refresh}
        variant="outlined"
        disabled={isReviewLoading}
      >
        {isReviewLoading ? 'Refreshing' : 'Refresh Data'}
      </CustomButton>
    </Stack>
  );
};

export default AllocationActionToolbar;
