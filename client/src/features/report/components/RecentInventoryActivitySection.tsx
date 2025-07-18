import { useEffect, useMemo, lazy, Suspense } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import CustomTypography from '@components/common/CustomTypography';
import Loading from '@components/common/Loading';
import { useBaseInventoryActivityLogs } from '@hooks/useInventoryActivityLogs';
import { mergeInventoryActivityLogs } from '@features/report/utils/logUtils';

const PermissionLogMiniTable = lazy(
  () => import('./PermissionLogMiniTable')
);

const RecentInventoryActivitySection = () => {
  const {
    data: logData,
    loading: logLoading,
    error: logError,
    fetchLogs,
  } = useBaseInventoryActivityLogs();
  
  useEffect(() => {
    fetchLogs(30); // Fetch top 30 logs on mount
  }, [fetchLogs]);
  
  const mergedData = useMemo(() => mergeInventoryActivityLogs(logData), [logData]);
  
  return (
    <Box sx={{ px: { xs: 2, sm: 4 }, pb: 4 }}>
      <CustomTypography variant="h6" fontWeight={600} gutterBottom>
        Recent Inventory Activity Logs
      </CustomTypography>
      <Suspense fallback={<Skeleton height={200} />}>
        {logLoading ? (
          <Loading message="Loading recent inventory activity logs..." />
        ) : (
          <PermissionLogMiniTable
            data={mergedData}
            loading={logLoading}
            error={logError}
          />
        )}
      </Suspense>
    </Box>
  );
};

export default RecentInventoryActivitySection;
