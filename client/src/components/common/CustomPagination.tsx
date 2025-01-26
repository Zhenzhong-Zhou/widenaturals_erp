import { FC } from 'react';
import { Box, Pagination } from '@mui/material';
import { Typography } from '@components/index.ts';

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
    <Box display="flex" flexDirection="column" alignItems="center" marginTop={3}>
      {/* Pagination Controls */}
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, newPage) => onPageChange(newPage)}
      />
      
      {/* Footer Info */}
      <Typography variant="caption" align="center" display="block" marginTop={1}>
        Showing {startIndex}–{endIndex} of {totalRecords} items
      </Typography>
    </Box>
  );
};

export default CustomPagination;
