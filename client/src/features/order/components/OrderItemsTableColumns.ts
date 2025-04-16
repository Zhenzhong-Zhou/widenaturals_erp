import type { Column } from '@components/common/CustomTable';
import type { FetchedOrderItem } from '@features/order/state';
import { formatCurrency } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';

export const orderItemsColumns = (
  items: FetchedOrderItem[]
): Column<FetchedOrderItem>[] => {
  // Check if any item has `adjusted_price` different from `system_price`
  const hasAdjustedPrice = items.some(
    (item) => item.adjusted_price && item.adjusted_price !== item.system_price
  );

  const columns: Column<FetchedOrderItem>[] = [
    {
      id: 'item_name',
      label: 'Item Name',
      minWidth: 150,
      sortable: true,
    },
    { id: 'barcode', label: 'Barcode', minWidth: 150, sortable: true },
    { id: 'npn', label: 'NPN', minWidth: 150, sortable: true },
    {
      id: 'quantity_ordered',
      label: 'Quantity Ordered',
      minWidth: 100,
      sortable: true,
    },
    { id: 'price_type', label: 'Price Type', minWidth: 100, sortable: true },
    {
      id: 'system_price',
      label: 'System Price',
      minWidth: 100,
      sortable: true,
      format: (value) => {
        if (!value) return 'N/A';
        if (typeof value === 'string' && value.startsWith('$')) return value;
        return formatCurrency(parseFloat(value as string));
      },
    },
    {
      id: 'order_item_subtotal',
      label: 'Order Item Subtotal',
      minWidth: 100,
      sortable: true,
      format: (value) => {
        if (!value) return 'N/A';
        if (typeof value === 'string' && value.startsWith('$')) return value;
        return formatCurrency(parseFloat(value as string));
      },
    },
    {
      id: 'order_item_status_name',
      label: 'Status',
      minWidth: 100,
      sortable: true,
    },
    {
      id: 'order_item_status_date',
      label: 'Order Item Status Date',
      minWidth: 100,
      sortable: true,
      format: (value: string | number | undefined) => {
        if (typeof value === 'string') return formatDate(value);
        if (typeof value === 'number') return value.toString(); // If it's a number, just convert to string
        return 'N/A'; // Return 'N/A' if it's undefined or any other type
      },
    },
  ];

  if (hasAdjustedPrice) {
    columns.push({
      id: 'adjusted_price',
      label: 'Adjusted Price',
      minWidth: 100,
      sortable: true,
      format: (value) => {
        if (!value) return 'N/A';
        if (typeof value === 'string' && value.startsWith('$')) return value;
        return formatCurrency(parseFloat(value as string));
      },
    });
  }

  return columns;
};
