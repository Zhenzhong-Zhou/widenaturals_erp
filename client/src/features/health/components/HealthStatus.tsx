import type { FC } from 'react';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import CustomTypography from '@components/common/CustomTypography';
import { formatDateTime } from '@utils/dateTimeUtils';
import useHealthStatus from '@hooks/useHealthStatus';
import { formatLabel } from '@utils/textUtils';

interface HealthStatusProps {
  getStatusColor: (
    status: string
  ) => 'success' | 'warning' | 'error' | 'default';
}

const HealthStatus: FC<HealthStatusProps> = ({ getStatusColor }) => {
  // Use the health status hook
  const {
    healthStatus,
    loading,
    isHealthy,
    databaseStatus,
    poolStatus,
    timestamp,
    refreshHealthStatus,
    error,
  } = useHealthStatus();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {/* Health Indicator */}
      <Tooltip
        title={
          <Box sx={{ textAlign: 'left' }}>
            <CustomTypography variant="body2" sx={{ fontWeight: 'bold' }}>
              Server: {formatLabel(healthStatus?.server) || 'Unknown'}
            </CustomTypography>
            <CustomTypography variant="body2">
              Database: {formatLabel(databaseStatus) || 'Unknown'}
            </CustomTypography>
            <CustomTypography variant="body2">
              Pool: {formatLabel(poolStatus) || 'Unknown'}
            </CustomTypography>
            <CustomTypography variant="body2">
              Last Updated: {timestamp ? formatDateTime(timestamp) : 'N/A'}
            </CustomTypography>
            {error && (
              <CustomTypography variant="body2" color="error">
                Error: {error}
              </CustomTypography>
            )}
          </Box>
        }
        arrow
      >
        <Badge
          color={getStatusColor(
            loading ? 'loading' : isHealthy ? 'success' : 'error'
          )}
          variant="dot"
          sx={{ cursor: 'pointer' }}
          onClick={refreshHealthStatus} // Refresh health status on click
        >
          <CustomTypography
            variant="body2"
            sx={{
              color: 'text.primary',
              fontWeight: 'bold',
            }}
          >
            Health
          </CustomTypography>
        </Badge>
      </Tooltip>
    </Box>
  );
};

export default HealthStatus;
