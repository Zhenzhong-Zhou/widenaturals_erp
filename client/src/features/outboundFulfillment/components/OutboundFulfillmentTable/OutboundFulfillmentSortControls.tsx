import { type FC } from 'react';
import type { SortOrder } from '@shared-types/api';
import SortControls from '@components/common/SortControls';
import type { OutboundFulfillmentSortKey } from '@features/outboundFulfillment/state';

interface OutboundFulfillmentSortControlsProps {
  sortBy: OutboundFulfillmentSortKey;
  sortOrder: SortOrder;
  onSortByChange: (value: OutboundFulfillmentSortKey) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const sortOptions: { label: string; value: OutboundFulfillmentSortKey }[] = [
  { label: 'Shipment Status', value: 'shipmentStatus' },
  { label: 'Shipped At', value: 'shippedAt' },
  { label: 'Expected Delivery Date', value: 'expectedDeliveryDate' },
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  { label: 'Order Number', value: 'orderNumber' },
  { label: 'Warehouse', value: 'warehouseName' },
  { label: 'Delivery Method', value: 'deliveryMethod' },
  { label: 'Tracking Number', value: 'trackingNumber' },
  { label: 'Created By (First Name)', value: 'createdByFirstName' },
  { label: 'Created By (Last Name)', value: 'createdByLastName' },
  { label: 'Updated By (First Name)', value: 'updatedByFirstName' },
  { label: 'Updated By (Last Name)', value: 'updatedByLastName' },
];

const OutboundFulfillmentSortControls: FC<
  OutboundFulfillmentSortControlsProps
> = ({ sortBy, sortOrder, onSortByChange, onSortOrderChange }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortByChange={(value) =>
        onSortByChange(value as OutboundFulfillmentSortKey)
      }
      onSortOrderChange={onSortOrderChange}
      sortOptions={sortOptions}
    />
  );
};

export default OutboundFulfillmentSortControls;
