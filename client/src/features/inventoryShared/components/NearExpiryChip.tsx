import { type FC, memo } from 'react';
import { useTheme } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Props {
  isNearExpiry: boolean;
}

const NearExpiryChip: FC<Props> = ({ isNearExpiry }) => {
  const theme = useTheme();

  const statusConfig = isNearExpiry
    ? {
        label: 'Near Expiry',
        color: 'error',
        icon: <ErrorIcon fontSize="small" />,
        paletteColor: theme.palette.error.main,
      }
    : {
        label: 'OK',
        color: 'success',
        icon: <CheckCircleIcon fontSize="small" />,
        paletteColor: theme.palette.success.main,
      };

  return (
    <Chip
      label={statusConfig.label}
      color={statusConfig.color as 'error' | 'success'}
      icon={statusConfig.icon}
      size="small"
      variant="outlined"
      sx={{
        borderColor: statusConfig.paletteColor,
        color: statusConfig.paletteColor,
        fontWeight: 500,
      }}
    />
  );
};

export default memo(NearExpiryChip);
