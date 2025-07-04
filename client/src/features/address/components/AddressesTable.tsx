import { lazy, Suspense, useCallback, useMemo, type FC } from 'react';
import Box from '@mui/material/Box';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import CustomTable, { type Column } from '@components/common/CustomTable';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import type { AddressListItem } from '@features/address/state/addressTypes';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';

const AddressExpandedContent = lazy(() => import('./AddressExpandedContent'));

interface AddressesTableProps {
  data: AddressListItem[];
  page: number;
  totalPages: number;
  totalRecords: number;
  loading: boolean;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newLimit: number) => void;
  expandedRowId?: string | null;
  onSelectionChange?: (ids: string[]) => void;
  selectedRowIds?: string[];
  onDrillDownToggle?: (rowId: string) => void;
  onRefresh: () => void;
}

const AddressesTable: FC<AddressesTableProps> = ({
                                                   data,
                                                   page,
                                                   totalPages,
                                                   totalRecords,
                                                   loading,
                                                   rowsPerPage,
                                                   onPageChange,
                                                   onRowsPerPageChange,
                                                   expandedRowId,
                                                   onDrillDownToggle,
                                                   selectedRowIds,
                                                   onSelectionChange,
                                                   onRefresh,
                                                 }) => {
  const columns: Column<AddressListItem>[] = useMemo(() => {
    const base: Column<AddressListItem>[] = [
      { id: 'customerName', label: 'Customer Name', minWidth: 150, renderCell: (row) => formatLabel(row.customerName) },
      { id: 'label', label: 'Label', minWidth: 100, renderCell: (row) => formatLabel(row.label) },
      { id: 'recipientName', label: 'Recipient', minWidth: 120, renderCell: (row) => formatLabel(row.recipientName) },
      { id: 'city', label: 'City', minWidth: 100, renderCell: (row) => formatLabel(row.address.city) },
      { id: 'state', label: 'State', minWidth: 100, renderCell: (row) => formatLabel(row.address.state) },
      { id: 'country', label: 'Country', minWidth: 100, renderCell: (row) => formatLabel(row.address.country) },
      { id: 'createdAt', label: 'Created At', minWidth: 150, sortable: true, renderCell: (row) => formatDateTime(row.createdAt) },
    ];
    
    if (onDrillDownToggle) {
      base.push(
        createDrillDownColumn<AddressListItem>(
          (row) => onDrillDownToggle?.(row.id),
          (row) => expandedRowId === row.id
        )
      );
    }
    
    return base;
  }, [onDrillDownToggle, expandedRowId]);
  
  const renderExpandedContent = useCallback(
    (row: AddressListItem) => (
      <Suspense fallback={<SkeletonExpandedRow showSummary fieldPairs={3} summaryHeight={80} spacing={1} />}>
        <AddressExpandedContent row={row} />
      </Suspense>
    ),
    []
  );
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <CustomTypography variant="h6" fontWeight={600}>Customer List</CustomTypography>
        <CustomButton onClick={onRefresh} variant="outlined" sx={{ color: 'primary', fontWeight: 500 }}>
          Refresh
        </CustomButton>
      </Box>
      
      <CustomTable<AddressListItem>
        data={data}
        columns={columns}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        initialRowsPerPage={rowsPerPage}
        rowsPerPageOptions={[25, 50, 75, 100]}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        expandable
        expandedRowId={expandedRowId}
        expandedContent={renderExpandedContent}
        getRowId={(row) => row.id}
        selectedRowIds={selectedRowIds}
        onSelectionChange={onSelectionChange}
      />
    </Box>
  );
};

export default AddressesTable;
