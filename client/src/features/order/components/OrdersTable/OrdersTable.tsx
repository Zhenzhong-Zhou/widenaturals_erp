import { Suspense, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import {
  CustomButton,
  CustomTable,
  CustomTypography,
  SkeletonExpandedRow
} from '@components/index';
import type { OrderListItem } from '@features/order/state';
import {
  getOrdersTableColumns,
  OrderExpandedContent,
} from '@features/order/components/OrdersTable/index';

interface OrderTableProps {
  category: string;
  data: OrderListItem[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  expandedRowId?: string | null;
  onSelectionChange?: (ids: string[]) => void;
  selectedRowIds?: string[];
  onDrillDownToggle?: (rowId: string) => void;
  onRefresh: () => void;
}

const OrderTable = ({
  category,
  data,
  loading,
  page,
  totalPages,
  totalRecords,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  expandedRowId,
  onDrillDownToggle,
  selectedRowIds,
  onSelectionChange,
  onRefresh,
}: OrderTableProps) => {
  const columns = useMemo(() => {
    return getOrdersTableColumns(
      category,
      expandedRowId ?? undefined,
      onDrillDownToggle
    );
  }, [category, expandedRowId, onDrillDownToggle]);

  const renderExpandedContent = useCallback(
    (row: OrderListItem) => (
      <Suspense
        fallback={
          <SkeletonExpandedRow
            showSummary
            fieldPairs={3}
            summaryHeight={80}
            spacing={1}
          />
        }
      >
        <OrderExpandedContent row={row} />
      </Suspense>
    ),
    []
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <CustomTypography variant="h6" sx={{ fontWeight: 600 }}>
          Order List
        </CustomTypography>

        <CustomButton
          onClick={onRefresh}
          variant="outlined"
          sx={{ color: 'primary', fontWeight: 500 }}
        >
          Refresh
        </CustomButton>
      </Box>

      <CustomTable
        data={data}
        columns={columns}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        initialRowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 75]}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        expandable
        expandedRowId={expandedRowId}
        expandedContent={renderExpandedContent}
        getRowId={(row) => row.id}
        selectedRowIds={selectedRowIds}
        onSelectionChange={onSelectionChange}
        emptyMessage="No orders found"
      />
    </Box>
  );
};

export default OrderTable;
