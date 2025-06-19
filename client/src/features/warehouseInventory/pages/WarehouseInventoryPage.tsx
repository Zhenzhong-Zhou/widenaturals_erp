import { lazy, Suspense, useEffect, useMemo } from 'react';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BaseInventoryPage from '@features/inventoryShared/pages/InventoryListPageBase';
import useWarehouseInventory from '@hooks/useWarehouseInventory';
import { WAREHOUSE_INVENTORY_SORT_OPTIONS } from '../constants/sortOptions';
import WarehouseInventoryExpandedRow from '../components/WarehouseInventoryExpandedRow';
import WarehouseInventoryFilterPanel from '../components/WarehouseInventoryFilterPanel';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import { useBaseInventoryActivityLogs } from '@hooks/useInventoryActivityLogs';
import { type MergedInventoryActivityLogEntry, mergeInventoryActivityLogs } from '@features/report/utils/logUtils';
import Skeleton from '@mui/material/Skeleton';
import Loading from '@components/common/Loading';

const WarehouseInventoryTable = lazy(
  () => import('../components/WarehouseInventoryTable')
);
const PermissionLogMiniTable = lazy(
  () => import('@features/report/components/PermissionLogMiniTable')
);

const WarehouseInventoryPage = () => {
  const {
    data: logData,
    loading: logLoading,
    error: logError,
    fetchLogs,
  } = useBaseInventoryActivityLogs();
  
  // Fetch on mount or when page/limit changes
  useEffect(() => {
    fetchLogs(30); // server expects 1-based page
  }, [fetchLogs]);
  
  const mergedData: MergedInventoryActivityLogEntry[] = useMemo(
    () => mergeInventoryActivityLogs(logData),
    [logData]
  );
  
  return (
   <>
     {/* Main inventory section */}
     <BaseInventoryPage
       title="All Warehouse Inventory"
       Icon={<WarehouseIcon fontSize="medium" color="primary" />}
       useInventoryHook={useWarehouseInventory}
       FilterPanel={WarehouseInventoryFilterPanel}
       TableComponent={WarehouseInventoryTable}
       ExpandedRowComponent={WarehouseInventoryExpandedRow}
       sortOptions={WAREHOUSE_INVENTORY_SORT_OPTIONS}
       rowKey="id"
       extractGroupName={(record) =>
         record.warehouse?.name || 'Unknown Warehouse'
       }
     />
     
     {/* Spacer */}
     <Divider sx={{ my: 4 }} />
     
     {/* Logs section */}
     <Box sx={{ px: { xs: 2, sm: 4 }, pb: 4 }}>
       <CustomTypography variant="h6" fontWeight={600} gutterBottom>
         Recent Inventory Activity Logs
       </CustomTypography>
       <Suspense fallback={<Skeleton height={200} />}>
         {logLoading ? (
           <Loading message="Loading recent inevntory activity logs..." />
         ) : (
           <PermissionLogMiniTable
             data={mergedData}
             loading={logLoading}
             error={logError}
           />
         )}
       </Suspense>
     </Box>
   </>
  );
};

export default WarehouseInventoryPage;
