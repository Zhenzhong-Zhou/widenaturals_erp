import { type FC, Suspense, useCallback, useMemo } from 'react';
import CustomTable from '@components/common/CustomTable';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import type { OutboundShipmentRecord } from '@features/outboundFulfillment/state';
import {
  getOutboundFulfillmentTableColumns,
  OutboundFulfillmentExpandedContent,
} from '@features/outboundFulfillment/components/OutboundFulfillmentTable';

interface OutboundFulfillmentsTableProps {
  data: OutboundShipmentRecord[];
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
                                                                       }) => {
  const columns = useMemo(() => {
    return getOutboundFulfillmentTableColumns(
      expandedRowId ?? undefined,
      onDrillDownToggle
    );
  }, [expandedRowId, onDrillDownToggle]);
  
  const renderOutboundFulfillmentExpandedContent = useCallback(
    (row: OutboundShipmentRecord) => (
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
    <CustomTable<OutboundShipmentRecord>
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
  );
};

export default OutboundFulfillmentsTable;
