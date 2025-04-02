import { Chip } from '@mui/material';
import { FC } from 'react';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import { useThemeContext } from '../../../context/ThemeContext.tsx';

interface Props {
  stockLevel: 'none' | 'low' | 'critical' | 'normal';
  isLowStock: boolean;
}

const StockLevelChip: FC<Props> = ({ stockLevel, isLowStock }) => {
  const { theme } = useThemeContext();
  
  const colorMap: Record<Props['stockLevel'], 'warning' | 'error' | 'success' | null> = {
    none: null,
    low: 'warning',
    critical: 'error',
    normal: 'success',
  };
  
  const label = isLowStock ? `Low (${capitalizeFirstLetter(stockLevel)})` : 'Normal';
  const chipColor = isLowStock ? colorMap[stockLevel] : 'success';
  
  const paletteColor = chipColor ? theme.palette[chipColor].main : theme.palette.text.primary;
  
  return (
    <Chip
      label={label}
      color={chipColor || 'default'}
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

export default StockLevelChip;
