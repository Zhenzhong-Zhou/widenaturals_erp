import { type FC, type ReactNode } from 'react';
import { Box } from '@mui/material';

interface Props {
  children: ReactNode;
  /** Reserved minimum width to keep adjacent columns aligned. */
  minWidth?: number;
}

/**
 * Fixed-width container for alert chips that may or may not render.
 * Keeps adjacent columns vertically aligned across rows where some
 * rows show a chip and others do not.
 */
const ChipSlot: FC<Props> = ({ children, minWidth = 90 }) => (
  <Box
    sx={{
      minWidth,
      display: 'flex',
      justifyContent: 'flex-start',
    }}
  >
    {children}
  </Box>
);

export default ChipSlot;
