import { memo, type FC, useMemo } from 'react';
import Chip from '@mui/material/Chip';
import { useThemeContext } from '@context/ThemeContext.tsx';

interface Props {
  isExpired: boolean;
}

const IsExpiredChip: FC<Props> = ({ isExpired }) => {
  const { theme } = useThemeContext();
  
  const { label, color } = useMemo(() => {
    return isExpired
      ? {
        label: 'Yes',
        color: theme.palette.error.main,
      }
      : {
        label: 'No',
        color: theme.palette.success.main,
      };
  }, [isExpired, theme]);
  
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={{
        borderColor: color,
        color,
        fontWeight: 500,
      }}
    />
  );
};

export default memo(IsExpiredChip);
