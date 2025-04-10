import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';

interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  sx?: object;
}

const CustomList: FC<ListProps<any>> = ({
  items,
  renderItem,
  emptyMessage = 'No items found.',
  sx,
}) => {
  return (
    <Box sx={{ ...sx }}>
      {items.length > 0 ? (
        items.map((item, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            {renderItem(item, index)}
          </Box>
        ))
      ) : (
        <CustomTypography variant="body2" align="center">
          {emptyMessage}
        </CustomTypography>
      )}
    </Box>
  );
};

export default CustomList;
