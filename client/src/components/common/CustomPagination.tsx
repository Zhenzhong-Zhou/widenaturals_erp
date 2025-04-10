import { FC } from 'react';
import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import CustomTypography from '@components/common/CustomTypography';

interface PaginationComponentProps {
  page: number; // Current page
  totalPages: number; // Total number of pages
  totalRecords: number; // Total number of items
  onPageChange: (newPage: number) => void; // Function to handle page changes
  itemsPerPage?: number; // Optional: Items per page
}

const CustomPagination: FC<PaginationComponentProps> = ({
  page,
  totalPages,
  totalRecords,
  onPageChange,
  itemsPerPage,
}) => {
  const startIndex = (page - 1) * (itemsPerPage || 10) + 1;
  const endIndex = Math.min(page * (itemsPerPage || 10), totalRecords);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      marginTop={3}
    >
      {/* Pagination Controls */}
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, newPage) => onPageChange(newPage)}
      />

      {/* Footer Info */}
      <CustomTypography
        variant="caption"
        align="center"
        display="block"
        marginTop={1}
      >
        Showing {startIndex}–{endIndex} of {totalRecords} items
      </CustomTypography>
    </Box>
  );
};

export default CustomPagination;
