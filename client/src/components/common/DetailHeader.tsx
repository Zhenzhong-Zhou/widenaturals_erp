import { FC } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { Typography } from '@components/index.ts';

interface DetailHeaderProps {
  avatarSrc?: string;
  avatarFallback?: string;
  name: string;
  subtitle?: string;
}

const DetailHeader: FC<DetailHeaderProps> = ({ avatarSrc, avatarFallback, name, subtitle }) => (
  <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
    <Avatar
      src={avatarSrc}
      alt={name}
      sx={{
        width: 100,
        height: 100,
        margin: '0 auto',
        bgcolor: 'primary.main',
        fontSize: 36,
      }}
    >
      {avatarFallback}
    </Avatar>
    <Typography variant="h6" sx={{ marginTop: 2 }}>
      {name}
    </Typography>
    {subtitle && (
      <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: 2 }}>
        {subtitle}
      </Typography>
    )}
  </Box>
);

export default DetailHeader;
