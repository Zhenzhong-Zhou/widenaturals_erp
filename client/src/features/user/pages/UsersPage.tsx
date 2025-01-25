import { FC } from 'react';
import { Box, Alert } from '@mui/material';
import UsersList from '../components/UserList.tsx';
import { useUsers } from '../../../hooks';
import {
  CustomButton,
  ErrorMessage,
  Loading,
  Typography,
} from '@components/index.ts';
import CustomPagination from '@components/common/CustomPagination.tsx';

const UsersPage: FC = () => {
  const { users, loading, error, refetchUsers } = useUsers();
  const usersList = users.data;
  const usersPagination = users.pagination;
  
  // Extract pagination details
  const { page, totalPages, totalRecords, limit } = usersPagination;
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    refetchUsers({ page: newPage, limit }); // Trigger data fetching for the new page
  };
  
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      
      {/* Show Loading Spinner */}
      {loading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="50vh"
        >
          <Loading message={'Loading All Users...'} />
        </Box>
      )}
      
      {/* Show Error Message */}
      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          <ErrorMessage message={error} />
        </Alert>
      )}
      
      {/* Show Users List */}
      {!loading && !error && usersList.length > 0 ? (
        <>
          <UsersList users={usersList} />
          <CustomPagination
            page={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        !loading &&
        !error && (
          <Typography variant="body1" align="center">
            No users found.
          </Typography>
        )
      )}
      
      <Box mt={3}>
        <CustomButton onClick={() => refetchUsers()}>Refetch Users</CustomButton>
      </Box>
    </Box>
  );
};

export default UsersPage;
