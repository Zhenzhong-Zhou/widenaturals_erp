import { Suspense, useCallback, useMemo, useState } from 'react';
import { CustomTable, SkeletonExpandedRow } from '@components/index';
import type { InventoryActivityLogRecord } from '@features/warehouseInventory';
import {
  getInventoryActivityLogColumns,
  WarehouseInventoryActivityLogExpandedContent,
} from '@features/warehouseInventory/components/WarehouseInventoryActivityLogListTable';

interface WarehouseInventoryActivityLogTableProps {
  data: InventoryActivityLogRecord[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  canViewDetail?: boolean;
  showItemContext?: boolean;
}

/**
 * Warehouse Inventory Activity Log Table
 *
 * Paginated, expandable table for activity log entries. Read-only — no
 * selection, modals, or row actions; the parent owns filtering and any
 * page-level controls.
 *
 * Drill-down state lives inside the table (same pattern as
 * WarehouseInventoryListTable) so expand survives data refreshes within
 * the same parent context. Resetting expand on filter changes is handled
 * implicitly by data turnover — rows that disappear simply stop rendering
 * their expanded panel.
 */
const WarehouseInventoryActivityLogListTable = ({
  data,
  loading,
  page,
  rowsPerPage,
  totalPages,
  totalRecords,
  onPageChange,
  onRowsPerPageChange,
  canViewDetail = true,
  showItemContext = false,
}: WarehouseInventoryActivityLogTableProps) => {
  // ── Drill-down ────────────────────────────────────────────────────────────
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const handleDrillDownToggle = useCallback((rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  }, []);

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getInventoryActivityLogColumns({
        canViewDetail,
        expandedRowId,
        handleDrillDownToggle,
        showItemContext,
      }),
    [canViewDetail, expandedRowId, handleDrillDownToggle, showItemContext]
  );

  // ── Expanded row ──────────────────────────────────────────────────────────
  const renderExpandedContent = useCallback(
    (row: InventoryActivityLogRecord) => (
      <Suspense
        fallback={
          <SkeletonExpandedRow
            showSummary
            fieldPairs={4}
            summaryHeight={80}
            spacing={1}
          />
        }
      >
        <WarehouseInventoryActivityLogExpandedContent row={row} />
      </Suspense>
    ),
    []
  );

  return (
    <CustomTable<InventoryActivityLogRecord>
      data={data}
      columns={columns}
      loading={loading}
      page={page}
      totalPages={totalPages}
      totalRecords={totalRecords}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[10, 25, 50]}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      expandable
      expandedRowId={expandedRowId}
      expandedContent={renderExpandedContent}
      getRowId={(row) => row.id}
      emptyMessage="No activity log records found"
    />
  );
};

export default WarehouseInventoryActivityLogListTable;
