import { type FC, useMemo } from 'react';
import Box from '@mui/material/Box';
import { CustomButton, CustomTable, CustomTypography } from '@components/index';
import type { FlattenedOrderTypeRecord } from '@features/orderType/state';
import { getOrderTypeTableColumns } from '@features/orderType/components/index';

/**
 * OrderTypesTable
 *
 * Presentational table component for displaying a paginated list of
 * order types. Handles rendering, pagination, and refresh actions
 * without owning data-fetching or transformation logic.
 */
interface OrderTypesTableProps {
  data: FlattenedOrderTypeRecord[];
  page: number;
  loading: boolean;
  totalRecords: number;
  totalPages: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRefresh: () => void;
}

const OrderTypesTable: FC<OrderTypesTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalRecords,
  totalPages,
  loading,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
}) => {
  // Column configuration is memoized to avoid re-creation across renders
  const orderTypeColumns = useMemo(() => getOrderTypeTableColumns(), []);

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6">Order Type List</CustomTypography>
        <CustomButton
          onClick={onRefresh}
          variant="outlined"
          sx={{ color: 'primary' }}
        >
          Refresh Data
        </CustomButton>
      </Box>

      <CustomTable
        columns={orderTypeColumns}
        data={data}
        page={page}
        initialRowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        totalRecords={totalRecords}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        loading={loading}
        emptyMessage="No order types found."
      />
    </Box>
  );
};

export default OrderTypesTable;
