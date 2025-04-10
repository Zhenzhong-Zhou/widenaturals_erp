import { FC } from 'react';
import { UsersCardProps } from '@features/user';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import CustomCard from '@components/common/CustomCard';
import CustomTypography from '@components/common/CustomTypography';

const UsersCard: FC<UsersCardProps> = ({ user }) => {
  const userInfo = [
    { label: 'Full Name', value: user.fullname },
    { label: 'Email', value: user.email },
    { label: 'Phone Number', value: user.phone_number },
    { label: 'Job Title', value: user.job_title },
    { label: 'Role', value: user.role },
  ];

  return (
    <CustomCard
      sx={{
        maxWidth: 300,
        margin: 'auto',
        boxShadow: 3,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', // Add hover animation
        '&:hover': {
          transform: 'scale(1.05)', // Slightly scale up the card on hover
          boxShadow: 6, // Increase shadow depth on hover
        },
      }}
      contentSx={{ padding: 2 }}
      ariaLabel={`${user.fullname} - User Card`}
    >
      {/* Avatar Placeholder */}
      <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
        <Avatar
          alt={user.fullname}
          src={user.avatar || ''}
          sx={{
            width: 80,
            height: 80,
            fontSize: '2rem',
            backgroundColor: (theme) => theme.palette.primary.light,
            color: (theme) => theme.palette.primary.contrastText,
          }}
        >
          {user.fullname?.[0]}
        </Avatar>
      </Box>

      {/* User Information */}
      <CustomTypography variant="h6" gutterBottom align="center">
        {user.fullname}
      </CustomTypography>
      {userInfo.map((info, index) => (
        <CustomTypography key={index} variant="body2">
          {info.label}: {info.value || 'N/A'}
        </CustomTypography>
      ))}
    </CustomCard>
  );
};

export default UsersCard;
