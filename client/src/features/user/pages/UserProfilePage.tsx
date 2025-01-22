import { FC } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import { Typography, Loading } from '@components/index.ts';
import { useAppSelector } from '../../../store/storeHooks.ts';
import { selectUserLoading, selectUserResponse } from '../state/userSelectors.ts';
import { selectLastLogin } from '../../session/state/sessionSelectors.ts';

const UserProfilePage: FC = () => {
  const response = useAppSelector(selectUserResponse);
  const lastLogin = useAppSelector(selectLastLogin); // Last login timestamp
  const loading = useAppSelector(selectUserLoading); // Last login timestamp
  const user = response?.data;
  
  // Handle loading state
  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <Loading message="Loading user profile..." />
      </Box>
    );
  }
  
  // Handle case where user data is not available
  if (!user) {
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          margin: 'auto',
          textAlign: 'center',
          padding: 3,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 2,
        }}
      >
        <Typography variant="h6">No user information available</Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 400,
        margin: 'auto',
        textAlign: 'center',
        padding: 3,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 2,
        position: 'relative',
      }}
    >
      
      {/* User Avatar */}
      <Avatar
        src={''}
        alt={user.firstname || 'User Avatar'}
        sx={{
          width: 100,
          height: 100,
          margin: '0 auto',
          bgcolor: 'primary.main',
          fontSize: 36,
        }}
      >
        {user.firstname?.charAt(0).toUpperCase() || 'U'}
      </Avatar>
      
      {/* User Details */}
      <Typography variant="h6" sx={{ marginTop: 2 }}>
        {user.firstname} {user.lastname}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          marginBottom: 2,
        }}
      >
        {user.email}
      </Typography>
      <Divider sx={{ margin: '16px 0' }} />
      
      {/* Additional Information */}
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
        Role: {user.role || 'N/A'}
      </Typography>
      {user.job_title && (
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          Job Title: {user.job_title}
        </Typography>
      )}
      {user.phone_number && (
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          Phone: {user.phone_number}
        </Typography>
      )}
      {lastLogin && (
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          Last Login: {new Date(lastLogin).toLocaleString()}
        </Typography>
      )}
      {user.created_at && (
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          Created At: {new Date(user.created_at).toLocaleString()}
        </Typography>
      )}
      {user.updated_at && (
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          Updated At: {new Date(user.updated_at).toLocaleString()}
        </Typography>
      )}
    </Box>
  );
};

export default UserProfilePage;
