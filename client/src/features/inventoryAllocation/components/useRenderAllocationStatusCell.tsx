import { useCallback } from 'react';
import { useThemeContext } from '@context/ThemeContext.tsx';
import Chip from '@mui/material/Chip';
import type { AllocationEligibleOrderItem } from '@features/order';

const useRenderAllocationStatusCell = () => {
  const { theme } = useThemeContext();
  
  return useCallback((row: AllocationEligibleOrderItem) => {
    if (
      row.available_quantity !== null &&
      row.available_quantity >= row.quantity_ordered
    ) {
      return (
        <Chip
          label="Allocatable"
      size="small"
      sx={{
        backgroundColor: theme.palette.success.main,
        color: theme.palette.text.primary,
          fontWeight: 500,
          textTransform: 'capitalize',
      }}
      />
    );
    }
    
    if (row.available_quantity !== null) {
      return (
        <Chip
          label="Not Enough"
      size="small"
      sx={{
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.text.primary,
          fontWeight: 500,
          textTransform: 'capitalize',
      }}
      />
    );
    }
    
    return (
      <Chip
        label="No Inventory Info"
    size="small"
    sx={{
      backgroundColor: theme.palette.grey[500],
        color: theme.palette.getContrastText(theme.palette.grey[500]),
        fontWeight: 500,
        textTransform: 'capitalize',
    }}
    />
  );
  }, [theme]);
};

export default useRenderAllocationStatusCell;