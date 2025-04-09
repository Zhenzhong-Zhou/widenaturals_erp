import { FC } from 'react';
import Chip from '@mui/material/Chip';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useThemeContext } from '@context/ThemeContext';

interface Props {
  isNearExpiry: boolean;
}

const NearExpiryChip: FC<Props> = ({ isNearExpiry }) => {
  const { theme } = useThemeContext();
  
  const paletteColor = isNearExpiry
    ? theme.palette.error.main
    : theme.palette.success.main;
  
  return (
    <Chip
      label={isNearExpiry ? 'Near Expiry' : 'OK'}
      color={isNearExpiry ? 'error' : 'success'}
      icon={
        isNearExpiry ? (
          <ErrorIcon fontSize="small" />
        ) : (
          <CheckCircleIcon fontSize="small" />
        )
      }
      size="small"
      variant="outlined"
      sx={{
        borderColor: paletteColor,
        color: paletteColor,
        fontWeight: 500,
      }}
    />
  );
};

export default NearExpiryChip;
