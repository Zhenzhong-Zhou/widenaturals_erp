import { type FC, useMemo } from 'react';
import CustomTable from '@components/common/CustomTable';
import type { FetchedOrderItem } from '@features/order/state';
import { orderItemsColumns } from '@features/order';

interface OrderItemsTableProps {
  items: FetchedOrderItem[];
}

const OrderItemsTable: FC<OrderItemsTableProps> = ({ items }) => {
  // Define the columns for the order items table
  const columns = useMemo(() => orderItemsColumns(items), [items]);
  
  return (
    <CustomTable
      columns={columns}
      data={items}
      page={0}
      totalRecords={items.length}
      onPageChange={() => {}} // No pagination handling for now
      onRowsPerPageChange={() => {}} // No pagination handling for now
      initialRowsPerPage={items.length} // Display all items by default
      rowsPerPageOptions={[items.length]} // Disable pagination options
    />
  );
};

export default OrderItemsTable;
