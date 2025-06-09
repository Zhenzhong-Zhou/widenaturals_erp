import {
  Suspense,
  type FC,
  type ReactNode,
  useEffect,
  useState,
  useCallback,
  type SyntheticEvent,
  type LazyExoticComponent,
  type MouseEvent,
} from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import ItemTypeTabs from '@features/inventoryShared/components/ItemTypeTabs';
import SortControls from '@components/common/SortControls';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import type { SortConfig } from '@shared-types/api';
import { groupBy } from 'lodash';
import type { InventoryRecord, ItemType } from '@features/inventoryShared/types/InventorySharedType';
import AdjustInventoryDialog from '@features/warehouseInventory/components/AdjustInventoryDialog';
import AddInventoryDialog from '@features/warehouseInventory/components/AddInventoryDialog';
import AdjustBulkInventoryDialog from '@features/warehouseInventory/components/AdjustBulkInventoryDialog';

interface BaseInventoryPageProps<T> {
  title: string;
  Icon: ReactNode;
  useInventoryHook: () => {
    records: T[];
    loading: boolean;
    error: string | null;
    pagination: { totalPages: number; totalRecords: number };
    fetchRecords: (
      pagination: { page: number; limit: number },
      filters: any,
      sort: SortConfig
    ) => void;
  };
  FilterPanel: FC<{
    initialFilters: any;
    onApply: (filters: any) => void;
    onReset: () => void;
    showActionsWhenAll?: boolean;
  }>;
  TableComponent: LazyExoticComponent<FC<any>>;
  ExpandedRowComponent: FC<{ record: T }>;
  sortOptions: { label: string; value: string }[];
  rowKey: keyof T;
  extractGroupName: (record: T) => string;
  topToolbar?: ReactNode;
}

const BaseInventoryPage = <T extends InventoryRecord>({
  title,
  Icon,
  useInventoryHook,
  FilterPanel,
  TableComponent,
  ExpandedRowComponent,
  sortOptions,
  rowKey,
  extractGroupName,
  topToolbar,
}: BaseInventoryPageProps<T>) => {
  const [itemTypeTab, setItemTypeTab] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortBy: '',
    sortOrder: '',
  });
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [isAddInventoryDialogOpen, setIsAddInventoryDialogOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [adjustTarget, setAdjustTarget] = useState<any | null>(null); // for single adjust modal
  const [selectedRecords, setSelectedRecords] = useState<T[]>([]);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false);
  
  const { records, loading, error, pagination, fetchRecords } =
    useInventoryHook();

  const batchType: ItemType | undefined =
    itemTypeTab === 1
      ? 'product'
      : itemTypeTab === 2
        ? 'packaging_material'
        : undefined;

  const grouped = groupBy(records, extractGroupName);

  useEffect(() => {
    fetchRecords({ page, limit }, filters, sortConfig);
  }, [page, limit, filters, sortConfig]);

  const handleItemTypeTabChange = (_: SyntheticEvent, newValue: number) => {
    setItemTypeTab(newValue);
    const newBatchType =
      newValue === 1
        ? 'product'
        : newValue === 2
          ? 'packaging_material'
          : undefined;
    setFilters((prev: any) => ({ ...prev, batchType: newBatchType }));
    setPage(1);
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters({ ...newFilters, batchType });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(batchType ? { batchType } : {});
    setPage(1);
  };

  const handlePageChange = useCallback(
    (newPage: number) => setPage(newPage + 1),
    []
  );
  const handleRowsPerPageChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const handleExpandToggle = (row: any) => {
    setExpandedRowId((prev) => (prev === row[rowKey] ? null : row[rowKey]));
  };

  const isRowExpanded = (row: any) => expandedRowId === row[rowKey];
  
  const handleAddOpen = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur(); // Remove focus before dialog renders
    setIsAddInventoryDialogOpen(true);
  };
  
  const handleAddClose = () => {
    setIsAddInventoryDialogOpen(false);
  };
  
  // Single Adjust
  const handleAdjustSingle = (row: any) => {
    setAdjustTarget(row.originalRecord); // Or just `row` depending on your structure
    setIsAdjustDialogOpen(true);
  };

  // Bulk Adjust
  const handleBulkAdjust = () => {
    setIsBulkAdjustOpen(true);
  };
  
  // Close dialog only
  const handleAdjustDialogClose = () => {
    setIsAdjustDialogOpen(false);
    setIsBulkAdjustOpen(false);
  };

  // Refresh inventory after the dialog fully closes
  const handleAdjustDialogExited = () => {
    fetchRecords({ page, limit }, filters, sortConfig);
  };
  
  // Selection change from table
  const handleSelectionChange = (ids: string[], records: any[]) => {
    setSelectedRowIds(ids);
    const selected = records.map((r) => r.originalRecord).filter(Boolean);
    setSelectedRecords(selected);
  };
  
  if (error) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  }

  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          {Icon}
          <CustomTypography variant="h5" fontWeight={600}>
            {title}
          </CustomTypography>
        </Stack>

        {topToolbar && <Box mb={2}>{topToolbar}</Box>}
        
        <Box mb={2}>
          <Box display="flex" gap={2}>
            <CustomButton
              onClick={handleAddOpen}
            >
              Add Inventory
            </CustomButton>
            <AddInventoryDialog
              open={isAddInventoryDialogOpen}
              onClose={handleAddClose}
              onExited={handleAdjustDialogExited}
            />
          </Box>
        </Box>

        <Stack spacing={3}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <ItemTypeTabs
              value={itemTypeTab}
              onChange={handleItemTypeTabChange}
            />
            <Stack spacing={1}>
              <CustomTypography variant="body1" color="text.secondary">
                Sort Options
              </CustomTypography>
              <SortControls
                sortBy={sortConfig.sortBy ?? ''}
                sortOrder={sortConfig.sortOrder ?? ''}
                onSortByChange={(value) =>
                  setSortConfig((prev) => ({ ...prev, sortBy: value }))
                }
                onSortOrderChange={(value) =>
                  setSortConfig((prev) => ({ ...prev, sortOrder: value }))
                }
                sortOptions={sortOptions}
              />
            </Stack>
          </Stack>

          <Divider sx={{ display: { xs: 'none', sm: 'block' } }} />

          <FilterPanel
            initialFilters={filters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            showActionsWhenAll={true}
          />
          
          {selectedRowIds.length > 0 && (
            <Box display="flex" justifyContent="flex-end">
              <CustomButton
                variant="contained"
                onClick={handleBulkAdjust}
                size="small"
              >
                Adjust Selected ({selectedRowIds.length})
              </CustomButton>
            </Box>
          )}
          
          {isAdjustDialogOpen && adjustTarget && (
            <AdjustInventoryDialog
              open={isAdjustDialogOpen}
              record={adjustTarget}
              onClose={handleAdjustDialogClose}
              onExited={handleAdjustDialogExited}
            />
          )}
          
          {isBulkAdjustOpen && selectedRowIds.length > 0 && selectedRecords.length > 0 && (
            <AdjustBulkInventoryDialog
              open={isBulkAdjustOpen}
              selectedRowIds={selectedRowIds}
              selectedRecords={selectedRecords ?? []}
              onClose={handleAdjustDialogClose}
              onExited={handleAdjustDialogExited}
            />
          )}
          
          <Suspense fallback={<Skeleton height={180} width="100%" />}>
            <TableComponent
              isLoading={loading}
              groupedData={grouped}
              page={page - 1}
              rowsPerPage={limit}
              totalPages={pagination.totalPages}
              totalRecords={pagination.totalRecords}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              expandedRowId={expandedRowId}
              onExpandToggle={handleExpandToggle}
              isRowExpanded={isRowExpanded}
              expandedContent={(row: any) => (
                <ExpandedRowComponent record={row.originalRecord} />
              )}
              selectedRowIds={selectedRowIds}
              onSelectionChange={handleSelectionChange}
              onAdjustSingle={handleAdjustSingle}
            />
          </Suspense>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" mt={3}>
          <CustomButton
            variant="outlined"
            onClick={() => fetchRecords({ page, limit }, filters, sortConfig)}
          >
            Refresh Inventory
          </CustomButton>
        </Stack>
      </Paper>
    </Box>
  );
};

export default BaseInventoryPage;
