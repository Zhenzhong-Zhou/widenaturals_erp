import { type FC, Suspense, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import {
  CustomButton,
  CustomTable,
  CustomTypography,
  SkeletonExpandedRow
} from '@components/index';
import type { FlattenedOutboundShipmentRow } from '@features/outboundFulfillment/state';
import {
  getOutboundFulfillmentTableColumns,
  OutboundFulfillmentExpandedContent,
} from '@features/outboundFulfillment/components/OutboundFulfillmentTable';

interface OutboundFulfillmentsTableProps {
  data: FlattenedOutboundShipmentRow[];
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

/**
 * Pure table component for displaying outbound fulfillments (shipments).
 * Presentation-only: all data, pagination, and callbacks are passed via props.
 */
const OutboundFulfillmentsTable: FC<OutboundFulfillmentsTableProps> = ({
  data,
  loading,
  page,
  rowsPerPage,
  totalPages,
  totalRecords,
  onPageChange,
  onRowsPerPageChange,
  expandedRowId,
  onDrillDownToggle,
  selectedRowIds,
  onSelectionChange,
  onRefresh,
}) => {
  const columns = useMemo(() => {
    return getOutboundFulfillmentTableColumns(
      expandedRowId ?? undefined,
      onDrillDownToggle
    );
  }, [expandedRowId, onDrillDownToggle]);

  const renderOutboundFulfillmentExpandedContent = useCallback(
    (row: FlattenedOutboundShipmentRow) => (
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
        <OutboundFulfillmentExpandedContent row={row} />
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
          Outbound Shipments
        </CustomTypography>

        <CustomButton
          onClick={onRefresh}
          variant="outlined"
          sx={{ color: 'primary', fontWeight: 500 }}
        >
          Refresh
        </CustomButton>
      </Box>

      <CustomTable<FlattenedOutboundShipmentRow>
        loading={loading}
        data={data}
        columns={columns}
        page={page} // parent already converts backend 1-based → 0-based
        totalPages={totalPages}
        totalRecords={totalRecords}
        initialRowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        getRowId={(row) => row.shipmentId}
        expandedRowId={expandedRowId}
        expandable={!!onDrillDownToggle}
        expandedContent={renderOutboundFulfillmentExpandedContent}
        onSelectionChange={onSelectionChange}
        selectedRowIds={selectedRowIds}
        showCheckboxes={!!onSelectionChange}
        emptyMessage="No outbound fulfillments found."
      />
    </Box>
  );
};

export default OutboundFulfillmentsTable;
