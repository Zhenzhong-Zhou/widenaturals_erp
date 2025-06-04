import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import type { SxProps, Theme } from '@mui/system';

interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  sx?: SxProps<Theme>;
  role?: string;
  ariaLabel?: string;
}

const CustomList = <T,>({
  items,
  renderItem,
  emptyMessage = 'No items found.',
  sx,
  role = 'list',
  ariaLabel = 'custom list',
}: ListProps<T>): ReactNode => {
  return (
    <Box sx={{ ...sx }} role={role} aria-label={ariaLabel}>
      {items.length > 0 ? (
        items.map((item, index) => (
          <Box key={index} sx={{ mb: 2 }} role="listitem">
            {renderItem(item, index)}
          </Box>
        ))
      ) : (
        <CustomTypography variant="body2" align="center" sx={{ opacity: 0.7 }}>
          {emptyMessage}
        </CustomTypography>
      )}
    </Box>
  );
};

export default CustomList;
