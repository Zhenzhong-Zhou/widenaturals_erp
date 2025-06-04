import type { FC } from 'react';
import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import CustomTypography from '@components/common/CustomTypography';
import type { SxProps, Theme } from '@mui/system';

interface PaginationComponentProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (newPage: number) => void;
  itemsPerPage?: number;
  sx?: SxProps<Theme>; // Optional external override
}

const CustomPagination: FC<PaginationComponentProps> = ({
  page,
  totalPages,
  totalRecords,
  onPageChange,
  itemsPerPage = 10,
  sx,
}) => {
  const startIndex = (page - 1) * itemsPerPage + 1;
  const endIndex = Math.min(page * itemsPerPage, totalRecords);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: 4,
        px: 2,
        fontFamily: "'Roboto', sans-serif",
        ...sx,
      }}
    >
      {/* Pagination */}
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, newPage) => onPageChange(newPage)}
        shape="rounded"
        color="primary"
        size="medium"
        sx={{
          '& .MuiPaginationItem-root': {
            fontWeight: 500,
            fontSize: '0.875rem',
          },
        }}
      />

      {/* Pagination summary */}
      <CustomTypography
        variant="caption"
        align="center"
        sx={{ mt: 1.5, color: 'text.secondary', fontSize: '0.75rem' }}
      >
        Showing {startIndex}–{endIndex} of {totalRecords} items
      </CustomTypography>
    </Box>
  );
};

export default CustomPagination;
