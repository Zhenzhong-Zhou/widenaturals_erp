import { FC, useEffect } from 'react';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import { Tooltip, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/storeHooks';
import {
  selectServerStatus,
  selectDatabaseStatus,
  selectPoolStatus,
  selectHealthTimestamp,
} from '../state/healthStatusSelectors';
import { fetchHealthStatus } from '../state/healthStatusThunk';

interface HealthStatusProps {
  getStatusColor: (status: string) => 'success' | 'warning' | 'error' | 'default';
}

const HealthStatus: FC<HealthStatusProps> = ({ getStatusColor }) => {
  const dispatch = useAppDispatch();
  
  const serverStatus = useAppSelector(selectServerStatus);
  const databaseStatus = useAppSelector(selectDatabaseStatus);
  const poolStatus = useAppSelector(selectPoolStatus);
  const lastUpdated = useAppSelector(selectHealthTimestamp);
  
  useEffect(() => {
    dispatch(fetchHealthStatus());
  }, [dispatch]);
  
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
              Server: {serverStatus}
            </Typography>
            <Typography variant="body2">Database: {databaseStatus}</Typography>
            <Typography variant="body2">Pool: {poolStatus}</Typography>
            <Typography variant="body2">
              Last Updated: {new Date(lastUpdated).toLocaleString()}
            </Typography>
          </Box>
        }
        arrow
      >
        <Badge
          color={getStatusColor(serverStatus)}
          variant="dot"
          sx={{ cursor: 'pointer' }}
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
