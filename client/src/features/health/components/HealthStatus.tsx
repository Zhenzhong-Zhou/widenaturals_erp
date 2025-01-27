import { FC } from 'react';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import { Tooltip, Typography } from '@mui/material';
import { useHealthStatus } from '../../../hooks';
import { formatDateTime } from '@utils/dateTimeUtils.ts';

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
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Server: {healthStatus?.server || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              Database: {databaseStatus || 'Unknown'}
            </Typography>
            <Typography variant="body2">Pool: {poolStatus || 'Unknown'}</Typography>
            <Typography variant="body2">
              Last Updated: {timestamp ? formatDateTime(timestamp) : 'N/A'}
            </Typography>
            {error && (
              <Typography variant="body2" color="error">
                Error: {error}
              </Typography>
            )}
          </Box>
        }
        arrow
      >
        <Badge
          color={getStatusColor(loading ? 'loading' : isHealthy ? 'success' : 'error')}
          variant="dot"
          sx={{ cursor: 'pointer' }}
          onClick={refreshHealthStatus} // Refresh health status on click
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              fontWeight: 'bold',
            }}
          >
            Health
          </Typography>
        </Badge>
      </Tooltip>
    </Box>
  );
};

export default HealthStatus;
