import { FC, useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import UsersList from '../components/UserList.tsx';
import { User } from '../state/userTypes.ts';
import { userService } from '../../../services/userService.ts';

const UsersPage: FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.fetchUsers();
        console.log("user: ",response)
        setUsers(response.data);
      } catch (err) {
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      
      {/* Show Loading Spinner */}
      {/*{loading && (*/}
      {/*  <Box display="flex" justifyContent="center" alignItems="center" height="50vh">*/}
      {/*    <CircularProgress />*/}
      {/*  </Box>*/}
      {/*)}*/}
      
      {/* Show Error Message */}
      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          {error}
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
    </Box>
  );
};

export default UsersPage;
