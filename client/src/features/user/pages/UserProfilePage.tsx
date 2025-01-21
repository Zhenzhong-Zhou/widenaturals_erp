import { FC } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { Typography } from '@components/index.ts';
import Divider from '@mui/material/Divider';
import { useAppSelector } from '../../../store/storeHooks.ts';
import { selectUserResponse } from '../state/userSelectors.ts';

const UserProfilePage: FC = () => {
  const response = useAppSelector(selectUserResponse);
  const user = response?.data;
  
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
      {user.created_at && (
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          Created At: {user.created_at}
        </Typography>
      )}
      {user.updated_at && (
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          Updated At: {user.updated_at}
        </Typography>
      )}
    </Box>
  );
};

export default UserProfilePage;
