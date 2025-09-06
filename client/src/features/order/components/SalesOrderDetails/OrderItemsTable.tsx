import { type FC, useState } from 'react';
import CustomTable from '@components/common/CustomTable';
import { OrderItemDetailSection } from '@features/order/components/SalesOrderDetails/index';
import type { OrderItem } from '@features/order/state';
import { getOrderItemColumns } from '@features/order/utils/orderItemsTableColumns';

interface OrderItemsTableProps {
  items: OrderItem[];
  itemCount: number;
}

const OrderItemsTable: FC<OrderItemsTableProps> = ({ items, itemCount }) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };
  
  const columns = getOrderItemColumns(expandedRowId, handleDrillDownToggle);
  
  return (
    <CustomTable<OrderItem>
      columns={columns}
      data={items}
      page={0}
      totalRecords={itemCount}
      getRowId={(row) => row.id}
      expandable
      expandedRowId={expandedRowId}
      expandedContent={(row) => (
        <OrderItemDetailSection row={row} />
      )}
      onPageChange={() => {}} // No pagination handling for now
      onRowsPerPageChange={() => {}} // No pagination handling for now
      initialRowsPerPage={itemCount} // Display all items by default
      rowsPerPageOptions={[itemCount]} // Disable pagination options
    />
  );
};

export default OrderItemsTable;
