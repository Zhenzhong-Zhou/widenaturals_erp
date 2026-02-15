import { type FC, useState } from 'react';
import CustomTable from '@components/common/CustomTable';
import {
  getOrderItemColumns,
  OrderItemDetailSection,
} from '@features/order/components/SalesOrderDetails/index';
import { FlattenedOrderItemRow } from '@features/order/state';

interface OrderItemsTableProps {
  items: FlattenedOrderItemRow[];
  itemCount: number;
}

const OrderItemsTable: FC<OrderItemsTableProps> = ({ items, itemCount }) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };

  const columns = getOrderItemColumns(expandedRowId, handleDrillDownToggle);

  return (
    <CustomTable<FlattenedOrderItemRow>
      columns={columns}
      data={items}
      page={0}
      totalRecords={itemCount}
      getRowId={(row) => row.orderItemId}
      expandable
      expandedRowId={expandedRowId}
      expandedContent={(row) => (
        <OrderItemDetailSection itemId={row.orderItemId} />
      )}
      onPageChange={() => {}} // No pagination handling for now
      onRowsPerPageChange={() => {}} // No pagination handling for now
      initialRowsPerPage={itemCount} // Display all items by default
      rowsPerPageOptions={[itemCount]} // Disable pagination options
    />
  );
};

export default OrderItemsTable;
