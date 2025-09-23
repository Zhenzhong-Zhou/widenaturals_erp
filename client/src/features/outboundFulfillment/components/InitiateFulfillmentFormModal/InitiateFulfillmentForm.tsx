import type { FC } from 'react';
import CustomForm, { type FieldConfig } from '@components/common/CustomForm';
import type { InitiateFulfillmentBody } from '@features/outboundFulfillment/state';
import useInitiateOutboundFulfillment from '@hooks/useInitiateOutboundFulfillment';
import CustomButton from '@components/common/CustomButton';
import ErrorMessage from '@components/common/ErrorMessage';

interface InitiateFulfillmentFormProps {
  orderId: string;
  allocationIds: string[];
  defaultValues?: Partial<InitiateFulfillmentBody>;
  onSuccess?: () => void;
}

const InitiateFulfillmentForm: FC<InitiateFulfillmentFormProps> = ({
                                                                     orderId,
                                                                     allocationIds,
                                                                     defaultValues,
                                                                     onSuccess,
                                                                   }) => {
  const { loading, error, submit, reset } = useInitiateOutboundFulfillment();
  
  const fields: FieldConfig[] = [
    {
      id: 'fulfillmentNotes',
      label: 'Fulfillment Notes',
      type: 'textarea',
      rows: 5,
      grid: { xs: 12 }, // full width
    },
    {
      id: 'shipmentNotes',
      label: 'Shipment Notes',
      type: 'textarea',
      rows: 5,
      grid: { xs: 12 }, // full width
    },
    {
      id: 'shipmentBatchNote',
      label: 'Shipment Batch Note',
      type: 'textarea',
      rows: 5,
      grid: { xs: 12 }, // full width
    },
  ];
  
  const handleSubmit = async (formData: Record<string, any>) => {
    const body: InitiateFulfillmentBody = {
      allocations: { ids: allocationIds },
      fulfillmentNotes: formData.fulfillmentNotes,
      shipmentNotes: formData.shipmentNotes,
      shipmentBatchNote: formData.shipmentBatchNote,
    };
    
    try {
      const response = await submit({ orderId, body });
      if (response.success) {
        alert(response.message);
        onSuccess?.();
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to initiate outbound fulfillment');
    }
  };
  
  return (
    <CustomForm
      fields={fields}
      initialValues={defaultValues}
      onSubmit={handleSubmit}
      submitButtonLabel="Initiate Fulfillment"
    >
      {error && (
        <>
          <ErrorMessage color="error" message={error} />
          <CustomButton variant="outlined" onClick={reset} disabled={loading}>
            Retry
          </CustomButton>
        </>
      )}
    </CustomForm>
  );
};

export default InitiateFulfillmentForm;
