import type { FC, ReactNode } from 'react';
import Grid from '@mui/material/Grid';

const DetailsGrid: FC<{ children: ReactNode }> = ({ children }) => (
  <Grid container spacing={3}>{children}</Grid>
);

export const DetailsGridItem: FC<{
  children: ReactNode;
  fullWidth?: boolean
}> = ({
                                      children,
                                      fullWidth = false,
}) => (
  <Grid size={{ xs: 12, md: fullWidth ? 12 : 6 }}>
    {children}
  </Grid>
);

export default DetailsGrid;
