import type { FC } from 'react';
import Chip from '@mui/material/Chip';
import { useThemeContext } from '@context/ThemeContext';

interface Props {
  isExpired: boolean;
}

const IsExpiredChip: FC<Props> = ({ isExpired }) => {
  const { theme } = useThemeContext();

  const color = isExpired
    ? theme.palette.error.main
    : theme.palette.success.main;

  return (
    <Chip
      label={isExpired ? 'Yes' : 'No'}
      size="small"
      variant="outlined"
      sx={{
        borderColor: color,
        color: color,
        fontWeight: 500,
      }}
    />
  );
};

export default IsExpiredChip;
