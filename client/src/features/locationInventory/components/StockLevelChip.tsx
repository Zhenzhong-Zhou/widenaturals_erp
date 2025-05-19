import { memo, type FC, useMemo } from 'react';
import Chip from '@mui/material/Chip';
import type { Palette, PaletteColor } from '@mui/material';
import { useThemeContext } from '@context/ThemeContext';
import { formatLabel } from '@utils/textUtils';

interface Props {
  stockLevel: 'none' | 'low' | 'critical' | 'normal' | 'expired';
}

const StockLevelChip: FC<Props> = ({ stockLevel }) => {
  const { theme } = useThemeContext();
  
  const getPaletteColor = (chipColor: keyof Palette): string => {
    const paletteEntry = theme.palette[chipColor as keyof Palette] as PaletteColor | undefined;
    return paletteEntry?.main || theme.palette.text.primary;
  };
  
  const chipProps = useMemo(() => {
    const colorMap: Record<
      Props['stockLevel'],
      'warning' | 'error' | 'success' | 'default'
    > = {
      none: 'default',
      low: 'warning',
      critical: 'error',
      normal: 'success',
      expired: 'error',
    };
    
    const chipColor = colorMap[stockLevel];
    const label = formatLabel(stockLevel);
    const paletteColor =
      chipColor === 'default'
        ? theme.palette.text.primary
        : getPaletteColor(chipColor);;
    
    return {
      label,
      chipColor: chipColor === 'default' ? undefined : chipColor, // fallback to MUI default coloring
      paletteColor,
    };
  }, [stockLevel, theme]);
  
  return (
    <Chip
      label={chipProps.label}
      color={chipProps.chipColor}
      size="small"
      variant="outlined"
      sx={{
        borderColor: chipProps.paletteColor,
        color: chipProps.paletteColor,
        fontWeight: 500,
      }}
    />
  );
};

export default memo(StockLevelChip);
