import { type FC, useState } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import CustomTable from '@components/common/CustomTable';
import CustomButton from '@components/common/CustomButton';
import type { InventoryAllocationSummary } from '@features/inventoryAllocation/state';
import {
  getInventoryAllocationColumns,
  InventoryAllocationTableExpandedRow,
} from '@features/inventoryAllocation/components/InventoryAllocationTable';

interface InventoryAllocationTableProps {
  data: InventoryAllocationSummary[];
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRefresh: () => void;
}

const InventoryAllocationTable: FC<InventoryAllocationTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalPages,
  totalRecords,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };

  const columns = getInventoryAllocationColumns(
    expandedRowId,
    handleDrillDownToggle
  );

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          Inventory Allocations
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
        columns={columns}
        data={data}
        page={page}
        initialRowsPerPage={rowsPerPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        rowsPerPageOptions={[25, 50, 75, 100]}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        getRowId={(row) => row.orderId}
        expandable
        expandedRowId={expandedRowId}
        expandedContent={(row) => (
          <InventoryAllocationTableExpandedRow row={row} />
        )}
        emptyMessage="No inventory allocations found."
      />
    </Box>
  );
};

export default InventoryAllocationTable;
