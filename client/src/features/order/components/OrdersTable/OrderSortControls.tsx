import { type FC } from 'react';
import type { OrderListSortField } from '@features/order/state';
import type { SortOrder } from '@shared-types/api';
import SortControls from '@components/common/SortControls';

interface OrderSortControlsProps {
  sortBy: string;
  sortOrder: SortOrder;
  onSortByChange: (value: OrderListSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const sortOptions: { label: string; value: OrderListSortField }[] = [
  { label: 'Order #',          value: 'orderNumber'      },
  { label: 'Order Date',       value: 'orderDate'        },
  { label: 'Order Type',       value: 'orderType'        },
  { label: 'Status',           value: 'statusName'       },
  { label: 'Status Date',      value: 'statusDate'       },
  { label: 'Delivery Method',  value: 'deliveryMethod'   },
  { label: 'Customer First',   value: 'customerFirst'    },
  { label: 'Customer Last',    value: 'customerLast'     },
  { label: 'Payment Method',   value: 'paymentMethod'    },
  { label: 'Payment Status',   value: 'paymentStatus'    },
  { label: 'Created At',       value: 'createdAt'        },
  { label: 'Updated At',       value: 'updatedAt'        },
  { label: 'Created By',       value: 'createdBy'        },
  { label: 'Updated By',       value: 'updatedBy'        },
  { label: 'Default',          value: 'defaultNaturalSort' },
];

const OrderSortControls: FC<OrderSortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortByChange={(value) => onSortByChange(value as OrderListSortField)}
      onSortOrderChange={onSortOrderChange}
      sortOptions={sortOptions}
    />
  );
};

export default OrderSortControls;
