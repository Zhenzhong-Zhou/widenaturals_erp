import {
  startTransition,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Alert, Box, Snackbar } from '@mui/material';
import {
  CustomButton,
  CustomTable,
  CustomTypography,
  SkeletonExpandedRow,
} from '@components/index';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';
import {
  getWarehouseInventoryColumns,
  WarehouseInventoryExpandedContent,
} from '@features/warehouseInventory/components/WarehouseInventoryListTable';
import {
  AdjustQuantitiesModal,
  UpdateStatusModal,
  CreateInventoryModal,
} from '@features/warehouseInventory/components/operations';

interface WarehouseInventoryListTableProps {
  data: FlattenedWarehouseInventory[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  warehouseId: string;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRefresh: () => void;
  // Selection — controlled from page
  selectedRowIds: string[];
  selectedItems: FlattenedWarehouseInventory[];
  onSelectionChange: (ids: string[]) => void;
  // Permissions
  canViewDetail?: boolean;
  canAdjust?: boolean;
  canUpdateStatus?: boolean;
  canCreate?: boolean;
  canAdjustReserved?: boolean;
}

const SELECTION_LIMIT = 25;

/**
 * Warehouse Inventory List Table Component
 *
 * Paginated table for warehouse inventory records.
 * Drill-down is gated by canViewDetail.
 * canAdjust and canUpdateStatus flow through to the expanded row content
 * for adjust / update-status actions.
 */
const WarehouseInventoryListTable = ({
  data,
  loading,
  page,
  totalPages,
  totalRecords,
  rowsPerPage,
  warehouseId,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
  selectedRowIds,
  selectedItems,
  onSelectionChange,
  canViewDetail = false,
  canAdjust = false,
  canUpdateStatus = false,
  canCreate = false,
  canAdjustReserved = false,
}: WarehouseInventoryListTableProps) => {
  // ── Drill-down ────────────────────────────────────────────────────────────
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };

  // ── Modal state ───────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const handleSuccess = useCallback(
    (message?: string) => {
      setSnackbar({
        open: true,
        message: message || 'Operation completed',
        severity: 'success',
      });
      onSelectionChange([]);
      onRefresh();
    },
    [onRefresh, onSelectionChange]
  );

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getWarehouseInventoryColumns({
        canViewDetail,
        expandedRowId,
        handleDrillDownToggle,
      }),
    [canViewDetail, expandedRowId]
  );

  // ── Expanded row ──────────────────────────────────────────────────────────
  const renderExpandedContent = useCallback(
    (row: FlattenedWarehouseInventory) => (
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
        <WarehouseInventoryExpandedContent
          row={row}
          canAdjust={canAdjust}
          canUpdateStatus={canUpdateStatus}
        />
      </Suspense>
    ),
    [canAdjust, canUpdateStatus]
  );

  const hasSelection = selectedRowIds.length > 0;

  return (
    <Box>
      {/* ── Table header ─────────────────────────────────────────── */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          Inventory
          {hasSelection && (
            <CustomTypography
              component="span"
              variant="body2"
              color="textSecondary"
              sx={{ ml: 1 }}
            >
              ({selectedRowIds.length} selected)
            </CustomTypography>
          )}
        </CustomTypography>

        <Box display="flex" gap={1} alignItems="center">
          {hasSelection && canUpdateStatus && (
            <CustomButton
              variant="outlined"
              onClick={() => startTransition(() => setUpdateStatusOpen(true))}
            >
              Update Status
            </CustomButton>
          )}
          {hasSelection &&
            canAdjust &&
            selectedRowIds.length <= SELECTION_LIMIT && (
              <CustomButton
                variant="outlined"
                onClick={() => startTransition(() => setAdjustOpen(true))}
              >
                {selectedRowIds.length === 1
                  ? 'Adjust Quantity'
                  : 'Adjust Quantities'}
              </CustomButton>
            )}
          {hasSelection && selectedRowIds.length > SELECTION_LIMIT && (
            <CustomTypography variant="caption" color="text.secondary">
              Reduce selection to {SELECTION_LIMIT} or fewer to bulk-adjust.
            </CustomTypography>
          )}
          {canCreate && (
            <CustomButton
              variant="contained"
              onClick={() => startTransition(() => setCreateOpen(true))}
            >
              + Add Inventory
            </CustomButton>
          )}
          <CustomButton
            onClick={onRefresh}
            variant="outlined"
            sx={{ color: 'primary.main', fontWeight: 500 }}
          >
            Refresh
          </CustomButton>
        </Box>
      </Box>

      {/* ── Main table ───────────────────────────────────────────── */}
      <CustomTable
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
        emptyMessage="No inventory records found"
        showCheckboxes={canAdjust || canUpdateStatus}
        selectedRowIds={selectedRowIds}
        onSelectionChange={onSelectionChange}
      />

      {/* ── Modals ───────────────────────────────────────────────── */}
      {canCreate && (
        <CreateInventoryModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          warehouseId={warehouseId}
          onSuccess={handleSuccess}
        />
      )}

      {canAdjust && (
        <AdjustQuantitiesModal
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          warehouseId={warehouseId}
          selectedItems={selectedItems}
          canAdjustReserved={canAdjustReserved}
          onSuccess={handleSuccess}
        />
      )}

      {canUpdateStatus && (
        <UpdateStatusModal
          open={updateStatusOpen}
          onClose={() => setUpdateStatusOpen(false)}
          warehouseId={warehouseId}
          selectedItems={selectedItems}
          onSuccess={handleSuccess}
        />
      )}

      <Snackbar
        open={snackbar?.open ?? false}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar?.severity ?? 'info'} variant="filled">
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WarehouseInventoryListTable;
