import {
  Suspense,
  type FC,
  type ReactNode,
  useEffect,
  useState,
  useCallback,
  type SyntheticEvent,
  type LazyExoticComponent,
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
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType.ts';

interface BaseInventoryPageProps<T> {
  title: string;
  Icon: ReactNode;
  useInventoryHook: () => {
    records: T[];
    loading: boolean;
    error: string | null;
    pagination: { totalPages: number; totalRecords: number };
    fetchRecords: (pagination: { page: number; limit: number }, filters: any, sort: SortConfig) => void;
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
}

const BaseInventoryPage = <T,>({
                                 title,
                                 Icon,
                                 useInventoryHook,
                                 FilterPanel,
                                 TableComponent,
                                 ExpandedRowComponent,
                                 sortOptions,
                                 rowKey,
                                 extractGroupName,
                               }: BaseInventoryPageProps<T>) => {
  const [itemTypeTab, setItemTypeTab] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ sortBy: '', sortOrder: '' });
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const {
    records,
    loading,
    error,
    pagination,
    fetchRecords,
  } = useInventoryHook();
  
  const batchType: ItemType | undefined =
    itemTypeTab === 1 ? 'product' :
      itemTypeTab === 2 ? 'packaging_material' :
        undefined;
  
  const grouped = groupBy(records, extractGroupName);
  
  useEffect(() => {
    fetchRecords({ page, limit }, filters, sortConfig);
  }, [page, limit, filters, sortConfig]);
  
  const handleItemTypeTabChange = (_: SyntheticEvent, newValue: number) => {
    setItemTypeTab(newValue);
    const newBatchType = newValue === 1 ? 'product' : newValue === 2 ? 'packaging_material' : undefined;
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
  
  const handlePageChange = useCallback((newPage: number) => setPage(newPage + 1), []);
  const handleRowsPerPageChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);
  
  const handleExpandToggle = (row: any) => {
    setExpandedRowId(prev => (prev === row[rowKey] ? null : row[rowKey]));
  };
  
  const isRowExpanded = (row: any) => expandedRowId === row[rowKey];
  
  if (error) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  }
  
  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3, backgroundColor: (theme) => theme.palette.background.default }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          {Icon}
          <CustomTypography variant="h5" fontWeight={600}>{title}</CustomTypography>
        </Stack>
        
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2}>
            <ItemTypeTabs value={itemTypeTab} onChange={handleItemTypeTabChange} />
            <Stack spacing={1}>
              <CustomTypography variant="body1" color="text.secondary">Sort Options</CustomTypography>
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
          
          <Suspense fallback={<Skeleton height={180} width="100%" />} >
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
              expandedContent={(row: any) => <ExpandedRowComponent record={row.originalRecord} />}
            />
          </Suspense>
        </Stack>
        
        <Stack direction="row" justifyContent="flex-end" mt={3}>
          <CustomButton variant="outlined" onClick={() => fetchRecords({ page, limit }, filters, sortConfig)}>
            Refresh Inventory
          </CustomButton>
        </Stack>
      </Paper>
    </Box>
  );
};

export default BaseInventoryPage;
