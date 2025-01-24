import { FC} from 'react';
import { Box, Alert } from '@mui/material';
import UsersList from '../components/UserList.tsx';
import { useUsers } from '../../../hooks';
import { CustomButton, ErrorMessage, Loading, Typography } from '@components/index.ts';

const UsersPage: FC = () => {
  const { users, loading, error, refetchUsers } = useUsers();
  
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      
      {/* Show Loading Spinner */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <Loading message={"Loading All Users..."} />
        </Box>
      )}
      
      {/* Show Error Message */}
      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          <ErrorMessage message={error} />
        </Alert>
      )}
      
      {/* Show Users List */}
      {!loading && !error && users.length > 0 ? (
        <UsersList users={users} />
      ) : (
        !loading && !error && (
          <Typography variant="body1" align="center">
            No users found.
          </Typography>
        )
      )}
      <CustomButton onClick={refetchUsers}>Refetch Users</CustomButton>
    </Box>
  );
};

export default UsersPage;
