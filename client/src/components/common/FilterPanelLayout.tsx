import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomButton from './CustomButton';

interface FilterPanelLayoutProps {
  children: ReactNode;
  onReset: () => void;
  borderless?: boolean;
}

const FilterPanelLayout: FC<FilterPanelLayoutProps> = ({
  children,
  onReset,
  borderless = false,
}) => (
  <Box mb={2} p={2} border={borderless ? 0 : '1px solid #ccc'} borderRadius={2}>
    <Grid container spacing={2}>
      {children}
    </Grid>

    <Box display="flex" flexWrap="wrap" gap={2} mt={3}>
      <CustomButton type="submit" variant="contained">
        Apply
      </CustomButton>
      <CustomButton variant="outlined" onClick={onReset}>
        Reset
      </CustomButton>
    </Box>
  </Box>
);

export default FilterPanelLayout;
