import { FC, Suspense, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import { CustomButton, CustomTable, CustomTypography, SkeletonExpandedRow } from '@components/index';
import { FlattenedLocationListRecord } from '@features/location';
import {
  getLocationTableColumns,
  LocationExpandedContent,
} from '@features/location/components/LocationListTable/index';

interface LocationTableProps {
  data: FlattenedLocationListRecord[];
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

const LocationListTable: FC<LocationTableProps> = ({
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
                                                   }: LocationTableProps) => {
  // ----------------------------------------
  // Column definitions
  // ----------------------------------------
  const columns = useMemo(
    () =>
      getLocationTableColumns(
        expandedRowId ?? undefined,
        onDrillDownToggle
      ),
    [expandedRowId, onDrillDownToggle]
  );
  
  // ----------------------------------------
  // Expanded row renderer (lazy)
  // ----------------------------------------
  const renderExpandedContent = useCallback(
    (row: FlattenedLocationListRecord) => (
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
        <LocationExpandedContent row={row} />
      </Suspense>
    ),
    []
  );
  
  return (
    <Box>
      {/* Table Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          Locations
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
        emptyMessage="No locations records found"
      />
    </Box>
  );
};

export default LocationListTable;
